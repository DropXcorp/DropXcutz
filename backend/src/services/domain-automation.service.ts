import { resolveCname, resolveTxt } from "node:dns/promises";
import { prisma } from "../config/prisma";

type Result = { status: "PENDING_DNS" | "VERIFYING" | "ACTIVE" | "FAILED"; error: string | null };

const root = () => process.env.PUBLIC_ROOT_DOMAIN?.trim().toLowerCase() ?? "";
const vercel = () => {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  const project = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token || !project) return null;
  const team = process.env.VERCEL_TEAM_ID?.trim();
  return { token, project, query: team ? `?teamId=${encodeURIComponent(team)}` : "" };
};

async function lookup<T>(task: Promise<T>): Promise<T | null> {
  try {
    return await task;
  } catch {
    return null;
  }
}

async function dnsProof(domain: string, token: string) {
  const [txt, cname] = await Promise.all([lookup(resolveTxt(`_dropxcutz-verify.${domain}`)), lookup(resolveCname(domain))]);
  const ownsByTxt = Boolean(txt?.some((chunks) => chunks.join("") === token));
  const target = `cname.${root()}`;
  const pointsHere = Boolean(cname?.some((value) => value.replace(/\.$/, "").toLowerCase() === target));
  return { ownsByTxt, pointsHere };
}

async function vercelCall(path: string, init?: RequestInit) {
  const config = vercel();
  if (!config) throw new Error("Vercel is not configured");
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`https://api.vercel.com${path}${config.query ? `${separator}${config.query.slice(1)}` : ""}`, {
    ...init,
    headers: { authorization: `Bearer ${config.token}`, "content-type": "application/json", ...init?.headers },
  });
  const body = (await response.json().catch(() => ({}))) as { error?: { code?: string; message?: string }; [key: string]: unknown };
  return { ok: response.ok, status: response.status, body };
}

/** Attaches the domain to the Vercel project (idempotent) and reports whether SSL/DNS is ready. */
async function attachAndCheckVercel(domain: string): Promise<Result> {
  const config = vercel()!;
  const add = await vercelCall(`/v10/projects/${config.project}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) });
  if (!add.ok && add.body.error?.code !== "domain_already_in_use" && add.status !== 409)
    return { status: "VERIFYING", error: add.body.error?.message ?? "Could not attach the domain to the hosting project yet." };
  if (!add.ok && add.body.error?.code === "domain_already_in_use")
    return { status: "FAILED", error: "This domain is already used by another hosting project." };
  const state = await vercelCall(`/v9/projects/${config.project}/domains/${encodeURIComponent(domain)}`);
  const verified = state.ok && state.body.verified === true;
  const dns = await vercelCall(`/v6/domains/${encodeURIComponent(domain)}/config`);
  const misconfigured = dns.ok ? dns.body.misconfigured === true : true;
  if (verified && !misconfigured) return { status: "ACTIVE", error: null };
  return { status: "VERIFYING", error: misconfigured ? "Waiting for DNS to point at the hosting provider." : "Waiting for the hosting provider to verify the domain." };
}

/** One verification pass for a single domain. */
export async function verifyDomain(salonId: string) {
  const settings = await prisma.salonWebsiteSettings.findUnique({ where: { salonId } });
  if (!settings?.customDomain || !settings.domainVerificationToken) return settings;
  if (!root()) {
    return prisma.salonWebsiteSettings.update({
      where: { salonId },
      data: { domainStatus: "FAILED", domainError: "The platform has no PUBLIC_ROOT_DOMAIN configured yet. Contact support." },
    });
  }
  const { ownsByTxt, pointsHere } = await dnsProof(settings.customDomain, settings.domainVerificationToken);
  let result: Result;
  if (!ownsByTxt && !pointsHere) {
    const stale = Date.now() - settings.updatedAt.getTime() > 72 * 3_600_000;
    result = {
      status: stale ? "FAILED" : "PENDING_DNS",
      error: stale
        ? "We couldn't find the DNS records after 3 days. Check them and press Verify again."
        : "DNS records not found yet. Changes can take up to a few hours to appear.",
    };
  } else if (vercel()) {
    result = await attachAndCheckVercel(settings.customDomain);
  } else {
    // Self-hosted: the reverse proxy terminates TLS, so pointing CNAME at us is enough.
    result = pointsHere ? { status: "ACTIVE", error: null } : { status: "VERIFYING", error: "TXT record found. Now point the CNAME at our host." };
  }
  if (settings.domainStatus === result.status && settings.domainError === result.error) return settings;
  return prisma.salonWebsiteSettings.update({
    where: { salonId },
    data: {
      domainStatus: result.status,
      domainError: result.error,
      ...(result.status === "ACTIVE" && settings.domainStatus !== "ACTIVE" ? { domainVerifiedAt: new Date() } : {}),
    },
  });
}

export async function verifyPendingDomains() {
  const pending = await prisma.salonWebsiteSettings.findMany({
    where: { customDomain: { not: null }, domainStatus: { in: ["PENDING_DNS", "VERIFYING"] } },
    select: { salonId: true },
    take: 50,
  });
  for (const item of pending) {
    try {
      const updated = await verifyDomain(item.salonId);
      if (updated?.domainStatus === "ACTIVE") await notifySiteChanged();
    } catch (error) {
      console.error("Domain verification failed", item.salonId, error);
    }
  }
}

/** Tells the multi-tenant public site to drop cached pages (fire-and-forget; site also self-refreshes in ≤60s). */
export async function notifySiteChanged(slug?: string) {
  const url = process.env.PUBLIC_SITE_REVALIDATE_URL?.trim();
  const secret = process.env.PUBLIC_SITE_REVALIDATE_SECRET?.trim();
  if (!url || !secret) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ slug: slug ?? null }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error("Public site revalidation failed", error);
  }
}
