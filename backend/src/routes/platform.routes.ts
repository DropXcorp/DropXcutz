import { Router } from "express";
import {
  createPlatformUser,
  createSalon,
  deleteSalon,
  restoreSalon,
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
import { requirePlatformPermission } from "../middleware/session.middleware";
import { createPlatformInvoice, listPlatformInvoices } from "../controllers/billing.controller";
import { confirmTwoFactor, disableTwoFactor, listLoginHistory, startTwoFactor } from "../controllers/auth.controller";
import { addTicketComment, createPlatformRole, createTicket, listPlatformRoles, listTickets, runBulkSalonUpdate, updatePlatformRole, updateTicket } from "../controllers/platform-operations.controller";
import { financialReport, financialReportCsv } from "../controllers/reports.controller";

export const platformRouter = Router();
platformRouter.use(requirePlatformAdmin);
platformRouter.get("/overview", platformOverview);
platformRouter.get("/salons", listSalons);
platformRouter.get("/salons/:id", getSalon);
platformRouter.post("/salons", createSalon);
platformRouter.patch("/salons/:id", updateSalon);
platformRouter.delete("/salons/:id", deleteSalon);
platformRouter.post("/salons/:id/restore", restoreSalon);
platformRouter.post("/notifications", sendNotification);
platformRouter.get("/billing/invoices", requirePlatformPermission("BILLING"), listPlatformInvoices);
platformRouter.post("/billing/invoices", requirePlatformPermission("BILLING"), createPlatformInvoice);
platformRouter.post("/security/two-factor/start", requirePlatformPermission("SECURITY"), startTwoFactor);
platformRouter.post("/security/two-factor/confirm", requirePlatformPermission("SECURITY"), confirmTwoFactor);
platformRouter.delete("/security/two-factor", requirePlatformPermission("SECURITY"), disableTwoFactor);
platformRouter.get("/security/login-history", requirePlatformPermission("SECURITY"), listLoginHistory);
platformRouter.get("/roles", requirePlatformPermission("ROLE_MANAGEMENT"), listPlatformRoles);
platformRouter.post("/roles", requirePlatformPermission("ROLE_MANAGEMENT"), createPlatformRole);
platformRouter.patch("/roles/:id", requirePlatformPermission("ROLE_MANAGEMENT"), updatePlatformRole);
platformRouter.get("/tickets", requirePlatformPermission("SUPPORT_TICKETS"), listTickets);
platformRouter.post("/tickets", requirePlatformPermission("SUPPORT_TICKETS"), createTicket);
platformRouter.patch("/tickets/:id", requirePlatformPermission("SUPPORT_TICKETS"), updateTicket);
platformRouter.post("/tickets/:id/comments", requirePlatformPermission("SUPPORT_TICKETS"), addTicketComment);
platformRouter.post("/bulk/salons", requirePlatformPermission("BULK_OPERATIONS"), runBulkSalonUpdate);
platformRouter.get("/reports/financial", requirePlatformPermission("REPORTING"), financialReport);
platformRouter.get("/reports/financial.csv", requirePlatformPermission("REPORTING"), financialReportCsv);
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
