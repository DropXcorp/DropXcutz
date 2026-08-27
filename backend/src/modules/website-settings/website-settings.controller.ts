import type { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { ok } from "../../controllers/http.controller";
import { websiteSettingsInput } from "../../validators/plan.validator";

export async function getWebsiteSettings(_request: Request, response: Response) {
  ok(response, await prisma.salonWebsiteSettings.findUnique({ where: { salonId: response.locals.salon.id } }));
}
export async function updateWebsiteSettings(request: Request, response: Response) {
  const input = websiteSettingsInput.parse(request.body);
  const { theme, ...rest } = input;
  const data = { ...rest, ...(theme !== undefined ? { theme: JSON.parse(JSON.stringify(theme)) } : {}) };
  ok(response, await prisma.salonWebsiteSettings.upsert({ where: { salonId: response.locals.salon.id }, create: { salonId: response.locals.salon.id, ...data }, update: data }));
}
