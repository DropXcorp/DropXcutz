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
platformRouter.get("/audit-log", listAuditLog);
platformRouter.get("/settings", getPlatformSettings);
platformRouter.put("/settings", updatePlatformSettings);
