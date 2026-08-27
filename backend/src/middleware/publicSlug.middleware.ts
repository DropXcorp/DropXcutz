import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "./error.middleware";
import { hasFeature } from "../services/feature.service";

/** Template sites derive their tenant exclusively from the public salon slug. */
export async function requirePublicSlug(request: Request, response: Response, next: NextFunction) {
  try {
    const slug = String(request.params.slug ?? "").trim().toLowerCase();
    const salon = await prisma.salon.findUnique({ where: { slug }, include: { websiteSettings: true } });
    if (!salon || !["ACTIVE", "TRIAL"].includes(salon.status)) throw new ApiError(404, "Salon not found.");
    if (salon.websiteSettings?.type !== "TEMPLATE") throw new ApiError(404, "Template website not found.");
    if (!(await hasFeature(salon.id, "TEMPLATE_WEBSITE"))) throw new ApiError(403, "Template website is not included in this subscription.");
    response.locals.salon = salon;
    next();
  } catch (error) { next(error); }
}
