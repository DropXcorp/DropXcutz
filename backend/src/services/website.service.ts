import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { hasFeature } from "./feature.service";

export const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "app", "admin", "erp", "dashboard", "mail", "smtp", "ftp", "cname", "static", "assets",
  "cdn", "docs", "help", "support", "status", "blog", "shop", "store", "login", "auth", "billing", "superadmin",
]);

export const slugPattern = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/;

export const normalizeSlug = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

/** Lower-cases a pasted URL/host down to a bare hostname; returns null for empty input. */
export function normalizeDomain(value: string | null | undefined) {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return null;
  const host = (raw.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0] ?? "").replace(/:\d+$/, "").replace(/\.$/, "");
  const valid = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host);
  if (!valid) throw new ApiError(400, "Enter a valid domain such as www.yoursalon.com.");
  const root = process.env.PUBLIC_ROOT_DOMAIN?.trim().toLowerCase();
  if (root && (host === root || host.endsWith(`.${root}`)))
    throw new ApiError(400, `Domains under ${root} are managed automatically. Use your own domain here.`);
  return host;
}

export const websiteSettingsPatch = z.object({
  type: z.enum(["NONE", "TEMPLATE", "CUSTOM"]).optional(),
  title: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  templateId: z.string().trim().max(40).nullable().optional(),
  theme: z.json().nullable().optional(),
  isPublished: z.boolean().optional(),
});
export type WebsiteSettingsPatch = z.infer<typeof websiteSettingsPatch>;

const featureLabel: Record<string, string> = {
  TEMPLATE_WEBSITE: "Template website",
  CUSTOM_WEBSITE: "Custom website",
  PUBLIC_API: "Public API",
  WEBSITE_MANAGEMENT: "Website management",
  ONLINE_BOOKING: "Online booking",
};

async function requireFeatures(salonId: string, codes: string[]) {
  const missing: string[] = [];
  for (const code of codes) if (!(await hasFeature(salonId, code))) missing.push(featureLabel[code] ?? code);
  if (missing.length)
    throw new ApiError(403, `This salon's subscription does not include: ${missing.join(", ")}. Ask the platform admin to enable it.`);
}

/** Single write path for website settings so entitlement rules can't be bypassed by either admin app. */
export async function saveWebsiteSettings(salonId: string, input: WebsiteSettingsPatch) {
  const current = await prisma.salonWebsiteSettings.findUnique({ where: { salonId } });
  const nextType = input.type ?? current?.type ?? "NONE";

  if (nextType === "TEMPLATE") await requireFeatures(salonId, ["TEMPLATE_WEBSITE", "ONLINE_BOOKING"]);
  if (nextType === "CUSTOM") await requireFeatures(salonId, ["CUSTOM_WEBSITE", "PUBLIC_API", "ONLINE_BOOKING"]);

  const wantsPublish = input.isPublished ?? current?.isPublished ?? false;
  const publish = nextType === "NONE" ? false : wantsPublish;
  const { theme, ...rest } = input;
  const data = {
    ...rest,
    type: nextType,
    isPublished: publish,
    ...(publish && !current?.isPublished ? { publishedAt: new Date() } : {}),
    ...(theme !== undefined ? { theme: theme === null ? undefined : JSON.parse(JSON.stringify(theme)) } : {}),
  };
  return prisma.salonWebsiteSettings.upsert({
    where: { salonId },
    create: { salonId, ...data },
    update: data,
  });
}

/** Starts (or clears) custom-domain verification. Domain becomes live only after DNS verification. */
export async function setCustomDomain(salonId: string, domainInput: string | null) {
  const domain = normalizeDomain(domainInput);
  const settings = await prisma.salonWebsiteSettings.findUnique({ where: { salonId } });
  if (!settings) throw new ApiError(409, "Configure the website first, then attach a domain.");
  if (!domain) {
    return prisma.salonWebsiteSettings.update({
      where: { salonId },
      data: { customDomain: null, domainStatus: "NONE", domainVerificationToken: null, domainVerifiedAt: null, domainError: null },
    });
  }
  const taken = await prisma.salonWebsiteSettings.findFirst({ where: { customDomain: domain, salonId: { not: salonId } }, select: { id: true } });
  if (taken) throw new ApiError(409, "This domain is already connected to another salon.");
  if (settings.customDomain === domain && settings.domainStatus !== "FAILED") return settings;
  return prisma.salonWebsiteSettings.update({
    where: { salonId },
    data: {
      customDomain: domain,
      domainStatus: "PENDING_DNS",
      domainVerificationToken: `dx-${randomBytes(12).toString("hex")}`,
      domainVerifiedAt: null,
      domainError: null,
    },
  });
}

export async function assertSlugAvailable(slug: string, salonId: string) {
  if (!slugPattern.test(slug)) throw new ApiError(400, "Use 3-60 lowercase letters, numbers or hyphens (no leading/trailing hyphen).");
  if (RESERVED_SUBDOMAINS.has(slug)) throw new ApiError(400, "That address is reserved. Please choose another.");
  const clash = await prisma.salon.findFirst({ where: { slug, id: { not: salonId } }, select: { id: true } });
  if (clash) throw new ApiError(409, "That address is already taken.");
}

/** What the admin apps show: settings plus the URLs the site is reachable on. */
export async function describeWebsite(salonId: string) {
  const [salon, settings] = await Promise.all([
    prisma.salon.findUniqueOrThrow({ where: { id: salonId }, select: { slug: true } }),
    prisma.salonWebsiteSettings.findUnique({ where: { salonId } }),
  ]);
  const root = process.env.PUBLIC_ROOT_DOMAIN?.trim();
  const scheme = process.env.NODE_ENV === "production" ? "https" : "http";
  const fallback = process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const subdomainUrl = root ? `${scheme}://${salon.slug}.${root}` : fallback ? `${fallback}?salon=${salon.slug}` : null;
  const customUrl = settings?.customDomain && settings.domainStatus === "ACTIVE" ? `https://${settings.customDomain}` : null;
  return {
    slug: salon.slug,
    settings,
    urls: { subdomain: subdomainUrl, custom: customUrl, live: customUrl ?? subdomainUrl },
    dns: settings?.customDomain && settings.domainStatus !== "ACTIVE" && settings.domainVerificationToken
      ? {
          cname: { host: settings.customDomain, value: root ? `cname.${root}` : "(set PUBLIC_ROOT_DOMAIN)" },
          txt: { host: `_dropxcutz-verify.${settings.customDomain}`, value: settings.domainVerificationToken },
        }
      : null,
  };
}
