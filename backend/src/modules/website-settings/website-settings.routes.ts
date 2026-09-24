import { Router } from "express";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import { requireFeature } from "../../middleware/feature.middleware";
import {
  getWebsiteSettings,
  updateWebsiteDomain,
  updateWebsiteSettings,
  updateWebsiteSlug,
  verifyWebsiteDomain,
} from "./website-settings.controller";

export const websiteSettingsRouter = Router();
websiteSettingsRouter.get("/", getWebsiteSettings);
websiteSettingsRouter.put("/", requireSalonAdmin, requireFeature("WEBSITE_MANAGEMENT"), updateWebsiteSettings);
websiteSettingsRouter.put("/slug", requireSalonAdmin, requireFeature("WEBSITE_MANAGEMENT"), updateWebsiteSlug);
websiteSettingsRouter.put("/domain", requireSalonAdmin, requireFeature("WEBSITE_MANAGEMENT"), updateWebsiteDomain);
websiteSettingsRouter.post("/domain/verify", requireSalonAdmin, requireFeature("WEBSITE_MANAGEMENT"), verifyWebsiteDomain);
