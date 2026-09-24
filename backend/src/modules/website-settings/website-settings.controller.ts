import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { ok } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { notifySiteChanged, verifyDomain } from "../../services/domain-automation.service";
import { hasFeature } from "../../services/feature.service";
import {
  assertSlugAvailable,
  describeWebsite,
  normalizeSlug,
  saveWebsiteSettings,
  setCustomDomain,
  websiteSettingsPatch,
} from "../../services/website.service";

const salonAudit = (salonId: string, userId: string | undefined, action: string, newValue: object) =>
  prisma.salonAuditLog.create({
    data: { salonId, userId: userId ?? null, action, entity: "WebsiteSettings", entityId: salonId, newValue },
  });

export async function getWebsiteSettings(_request: Request, response: Response) {
  ok(response, await describeWebsite(response.locals.salon.id));
}

export async function updateWebsiteSettings(request: Request, response: Response) {
  const salonId: string = response.locals.salon.id;
  const input = websiteSettingsPatch.parse(request.body);
  await saveWebsiteSettings(salonId, input);
  await salonAudit(salonId, response.locals.user?.id, "WEBSITE_SETTINGS_UPDATED", {
    type: input.type,
    isPublished: input.isPublished,
    templateId: input.templateId,
  });
  void notifySiteChanged(response.locals.salon.slug);
  ok(response, await describeWebsite(salonId));
}

export async function updateWebsiteSlug(request: Request, response: Response) {
  const salonId: string = response.locals.salon.id;
  const slug = normalizeSlug(z.object({ slug: z.string().min(1).max(80) }).parse(request.body).slug);
  await assertSlugAvailable(slug, salonId);
  await prisma.salon.update({ where: { id: salonId }, data: { slug } });
  await salonAudit(salonId, response.locals.user?.id, "WEBSITE_SLUG_CHANGED", { slug });
  void notifySiteChanged(slug);
  ok(response, await describeWebsite(salonId));
}

export async function updateWebsiteDomain(request: Request, response: Response) {
  const salonId: string = response.locals.salon.id;
  const { domain } = z.object({ domain: z.string().max(253).nullable() }).parse(request.body);
  if (domain && !(await hasFeature(salonId, "CUSTOM_WEBSITE")))
    throw new ApiError(403, "Custom domains are not included in this subscription.");
  await setCustomDomain(salonId, domain);
  await salonAudit(salonId, response.locals.user?.id, "WEBSITE_DOMAIN_CHANGED", { domain });
  ok(response, await describeWebsite(salonId));
}

export async function verifyWebsiteDomain(_request: Request, response: Response) {
  const salonId: string = response.locals.salon.id;
  await verifyDomain(salonId);
  ok(response, await describeWebsite(salonId));
}
