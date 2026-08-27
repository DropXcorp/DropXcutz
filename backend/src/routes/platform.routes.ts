import { Router } from "express";
import {
  createPlatformUser,
  createSalon,
  deleteSalon,
  getPlatformSettings,
  getSalon,
  listAuditLog,
  listPlatformUsers,
  listSalons,
  listSubscriptions,
  platformOverview,
  sendNotification,
  updatePlatformSettings,
  updatePlatformUser,
  updateSalon,
  listPlans, getPlan, createPlan, updatePlan, setPlanFeatures, listFeatures,
  getSalonSubscription, createSubscription, updateSubscription, renewSubscription,
  getSalonFeatureOverrides, setSalonFeatureOverride, getSalonWebsiteSettings, upsertSalonWebsiteSettings,
} from "../controllers/platform.controller";
import { requirePlatformAdmin } from "../middleware/session.middleware";

export const platformRouter = Router();
platformRouter.use(requirePlatformAdmin);
platformRouter.get("/overview", platformOverview);
platformRouter.get("/salons", listSalons);
platformRouter.get("/salons/:id", getSalon);
platformRouter.post("/salons", createSalon);
platformRouter.patch("/salons/:id", updateSalon);
platformRouter.delete("/salons/:id", deleteSalon);
platformRouter.post("/notifications", sendNotification);
platformRouter.get("/users", listPlatformUsers);
platformRouter.post("/users", createPlatformUser);
platformRouter.patch("/users/:id", updatePlatformUser);
platformRouter.get("/subscriptions", listSubscriptions);
platformRouter.get("/features", listFeatures);
platformRouter.get("/plans", listPlans);
platformRouter.post("/plans", createPlan);
platformRouter.get("/plans/:id", getPlan);
platformRouter.patch("/plans/:id", updatePlan);
platformRouter.put("/plans/:id/features", setPlanFeatures);
platformRouter.get("/salons/:id/subscription", getSalonSubscription);
platformRouter.post("/salons/:id/subscription", createSubscription);
platformRouter.patch("/salons/:id/subscription", updateSubscription);
platformRouter.post("/salons/:id/subscription/renew", renewSubscription);
platformRouter.get("/salons/:id/features", getSalonFeatureOverrides);
platformRouter.put("/salons/:id/features", setSalonFeatureOverride);
platformRouter.get("/salons/:id/website", getSalonWebsiteSettings);
platformRouter.put("/salons/:id/website", upsertSalonWebsiteSettings);
platformRouter.get("/audit-log", listAuditLog);
platformRouter.get("/settings", getPlatformSettings);
platformRouter.put("/settings", updatePlatformSettings);
