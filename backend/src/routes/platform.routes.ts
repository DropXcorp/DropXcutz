import { Router } from "express";
import {
  createPlatformUser,
  createSalon,
  deleteSalon,
  restoreSalon,
  getPlatformSettings,
  getSalon,
  listAuditLog,
  listAuditLogCsv,
  listPlatformUsers,
  listSalons,
  listSalonsCsv,
  listSessions,
  listSubscriptions,
  platformOverview,
  revokeSession,
  revokeUserSessions,
  sendNotification,
  updatePlatformSettings,
  updatePlatformUser,
  updateSalon,
  listPlans, getPlan, createPlan, updatePlan, setPlanFeatures, listFeatures,
  getSalonSubscription, createSubscription, updateSubscription, renewSubscription, cancelSubscription,
  getSalonFeatureOverrides, setSalonFeatureOverride, getSalonWebsiteSettings, upsertSalonWebsiteSettings, verifySalonDomain, listWebsites, getSystemStatus,
} from "../controllers/platform.controller";
import { requirePlatformAdmin } from "../middleware/session.middleware";
import { requirePlatformPermission } from "../middleware/session.middleware";
import { createPlatformInvoice, listPlatformInvoices } from "../controllers/billing.controller";
import { confirmTwoFactor, disableTwoFactor, impersonateSalon, listLoginHistory, startTwoFactor } from "../controllers/auth.controller";
import { addTicketComment, createPlatformRole, createTicket, listPlatformRoles, listTickets, runBulkSalonUpdate, updatePlatformRole, updateTicket } from "../controllers/platform-operations.controller";
import { financialReport, financialReportCsv } from "../controllers/reports.controller";

export const platformRouter = Router();
platformRouter.use(requirePlatformAdmin);
platformRouter.get("/overview", platformOverview);
platformRouter.get("/salons", listSalons);
platformRouter.get("/salons.csv", listSalonsCsv);
platformRouter.get("/salons/:id", getSalon);
platformRouter.post("/salons", requirePlatformPermission("SALON_MANAGEMENT"), createSalon);
platformRouter.patch("/salons/:id", requirePlatformPermission("SALON_MANAGEMENT"), updateSalon);
platformRouter.delete("/salons/:id", requirePlatformPermission("SALON_MANAGEMENT"), deleteSalon);
platformRouter.post("/salons/:id/restore", requirePlatformPermission("SALON_MANAGEMENT"), restoreSalon);
platformRouter.post("/notifications", requirePlatformPermission("SALON_MANAGEMENT"), sendNotification);
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
platformRouter.delete("/users/:id/sessions", requirePlatformPermission("SECURITY"), revokeUserSessions);
platformRouter.get("/sessions", requirePlatformPermission("SECURITY"), listSessions);
platformRouter.delete("/sessions/:id", requirePlatformPermission("SECURITY"), revokeSession);
platformRouter.get("/subscriptions", listSubscriptions);
platformRouter.get("/features", listFeatures);
platformRouter.get("/plans", listPlans);
platformRouter.post("/plans", createPlan);
platformRouter.get("/plans/:id", getPlan);
platformRouter.patch("/plans/:id", updatePlan);
platformRouter.put("/plans/:id/features", setPlanFeatures);
platformRouter.get("/salons/:id/subscription", getSalonSubscription);
platformRouter.post("/salons/:id/subscription", requirePlatformPermission("SALON_MANAGEMENT"), createSubscription);
platformRouter.patch("/salons/:id/subscription", requirePlatformPermission("SALON_MANAGEMENT"), updateSubscription);
platformRouter.post("/salons/:id/subscription/renew", requirePlatformPermission("SALON_MANAGEMENT"), renewSubscription);
platformRouter.post("/salons/:id/subscription/cancel", requirePlatformPermission("SALON_MANAGEMENT"), cancelSubscription);
platformRouter.post("/salons/:id/impersonate", requirePlatformPermission("SECURITY"), impersonateSalon);
platformRouter.get("/salons/:id/features", getSalonFeatureOverrides);
platformRouter.put("/salons/:id/features", requirePlatformPermission("SALON_MANAGEMENT"), setSalonFeatureOverride);
platformRouter.get("/websites", listWebsites);
platformRouter.get("/system-status", requirePlatformPermission("SECURITY"), getSystemStatus);
platformRouter.get("/salons/:id/website", getSalonWebsiteSettings);
platformRouter.put("/salons/:id/website", requirePlatformPermission("SALON_MANAGEMENT"), upsertSalonWebsiteSettings);
platformRouter.post("/salons/:id/website/verify-domain", requirePlatformPermission("SALON_MANAGEMENT"), verifySalonDomain);
platformRouter.get("/audit-log", requirePlatformPermission("SECURITY"), listAuditLog);
platformRouter.get("/audit-log.csv", requirePlatformPermission("SECURITY"), listAuditLogCsv);
platformRouter.get("/settings", getPlatformSettings);
platformRouter.put("/settings", updatePlatformSettings);
