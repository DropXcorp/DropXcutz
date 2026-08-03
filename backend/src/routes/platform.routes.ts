import { Router } from "express";
import {
  createSalon,
  getPlatformSettings,
  listAuditLog,
  listPlatformUsers,
  listSalons,
  listSubscriptions,
  platformOverview,
  updatePlatformSettings,
  updatePlatformUser,
  updateSalon,
  sendNotification,
} from "../controllers/platform.controller";
import { requirePlatformAdmin } from "../middleware/session.middleware";
export const platformRouter = Router();
platformRouter.use(requirePlatformAdmin);
platformRouter.get("/overview", platformOverview);
platformRouter.get("/salons", listSalons);
platformRouter.post("/salons", createSalon);
platformRouter.patch("/salons/:id", updateSalon);
platformRouter.post("/notifications", sendNotification);
platformRouter.get("/users", listPlatformUsers);
platformRouter.patch("/users/:id", updatePlatformUser);
platformRouter.get("/subscriptions", listSubscriptions);
platformRouter.get("/audit-log", listAuditLog);
platformRouter.get("/settings", getPlatformSettings);
platformRouter.put("/settings", updatePlatformSettings);
