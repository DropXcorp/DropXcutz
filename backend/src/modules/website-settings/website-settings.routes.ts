import { Router } from "express";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import { requireFeature } from "../../middleware/feature.middleware";
import { getWebsiteSettings, updateWebsiteSettings } from "./website-settings.controller";

export const websiteSettingsRouter = Router();
websiteSettingsRouter.get("/", getWebsiteSettings);
websiteSettingsRouter.put("/", requireSalonAdmin, requireFeature("WEBSITE_MANAGEMENT"), updateWebsiteSettings);
