import { Router } from "express";
import {
  bootstrap,
  listNotifications,
  markNotificationRead,
  updateSettings,
} from "../controllers/salon.controller";
import {
  adjustLoyalty,
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "../controllers/customer.controller";
import {
  createEmployee,
  createInventory,
  createService,
  deleteEmployee,
  deleteInventory,
  deleteService,
  updateEmployee,
  updateInventory,
  updateService,
} from "../controllers/catalog.controller";
import {
  createAppointment,
  createInvoiceController,
  createPayrollController,
  deleteAppointment,
  deleteInvoice,
  deletePayroll,
  updateAppointment,
  updateInvoice,
  updatePayroll,
} from "../controllers/operations.controller";
import {
  requireAuthenticatedSalonUser,
  requireSalonAdmin,
} from "../middleware/session.middleware";
import { requireFeature } from "../middleware/feature.middleware";
import {
  changePassword,
  login,
  logout,
  me,
} from "../controllers/auth.controller";

export const salonRouter = Router();
salonRouter.post("/auth/login", login);
salonRouter.post("/auth/logout", logout);
salonRouter.use(requireAuthenticatedSalonUser);
salonRouter.get("/auth/me", me);
salonRouter.put("/auth/password", changePassword);
salonRouter.get("/bootstrap", bootstrap);
salonRouter.post("/customers", requireFeature("CUSTOMERS"), createCustomer);
salonRouter.patch(
  "/customers/:id",
  requireFeature("CUSTOMERS"),
  updateCustomer,
);
salonRouter.delete(
  "/customers/:id",
  requireFeature("CUSTOMERS"),
  deleteCustomer,
);
salonRouter.post("/employees", requireFeature("EMPLOYEES"), createEmployee);
salonRouter.patch(
  "/employees/:id",
  requireFeature("EMPLOYEES"),
  updateEmployee,
);
salonRouter.delete(
  "/employees/:id",
  requireFeature("EMPLOYEES"),
  deleteEmployee,
);
salonRouter.post("/inventory", requireFeature("INVENTORY"), createInventory);
salonRouter.patch(
  "/inventory/:id",
  requireFeature("INVENTORY"),
  updateInventory,
);
salonRouter.delete(
  "/inventory/:id",
  requireFeature("INVENTORY"),
  deleteInventory,
);
salonRouter.post("/services", requireFeature("SERVICES"), createService);
salonRouter.patch("/services/:id", requireFeature("SERVICES"), updateService);
salonRouter.delete("/services/:id", requireFeature("SERVICES"), deleteService);
salonRouter.post(
  "/appointments",
  requireFeature("APPOINTMENTS"),
  createAppointment,
);
salonRouter.put(
  "/appointments/:id",
  requireFeature("APPOINTMENTS"),
  updateAppointment,
);
salonRouter.delete(
  "/appointments/:id",
  requireFeature("APPOINTMENTS"),
  deleteAppointment,
);
salonRouter.post(
  "/invoices",
  requireFeature("INVOICES"),
  createInvoiceController,
);
salonRouter.patch("/invoices/:id", requireFeature("INVOICES"), updateInvoice);
salonRouter.delete("/invoices/:id", requireFeature("INVOICES"), deleteInvoice);
salonRouter.post(
  "/payroll",
  requireFeature("PAYROLL"),
  createPayrollController,
);
salonRouter.patch("/payroll/:id", requireFeature("PAYROLL"), updatePayroll);
salonRouter.delete("/payroll/:id", requireFeature("PAYROLL"), deletePayroll);
salonRouter.put("/settings", requireSalonAdmin, updateSettings);
salonRouter.get("/notifications", listNotifications);
salonRouter.patch("/notifications/:id/read", markNotificationRead);
salonRouter.post(
  "/loyalty/:customerId/adjust",
  requireFeature("LOYALTY"),
  adjustLoyalty,
);
import { branchRouter } from "../modules/branches/branch.routes";
salonRouter.use("/branches", requireFeature("MULTI_BRANCH"), branchRouter);
import { serviceCategoryRouter } from "../modules/service-categories/service-category.routes";
salonRouter.use("/service-categories", serviceCategoryRouter);
import { employeeServiceRouter } from "../modules/employee-services/employee-service.routes";
salonRouter.use("/employee-services", employeeServiceRouter);
import { attendanceRouter } from "../modules/attendance/attendance.routes";
salonRouter.use("/attendance", requireFeature("EMPLOYEES"), attendanceRouter);
import { leaveRequestRouter } from "../modules/leave-requests/leave-request.routes";
salonRouter.use(
  "/leave-requests",
  requireFeature("EMPLOYEES"),
  leaveRequestRouter,
);
import { supplierRouter } from "../modules/suppliers/supplier.module";
salonRouter.use("/suppliers", requireFeature("INVENTORY"), supplierRouter);
import { expenseRouter } from "../modules/expenses/expense.module";
salonRouter.use("/expenses", expenseRouter);
import { purchaseOrderRouter } from "../modules/purchase-orders/purchase-order.module";
salonRouter.use(
  "/purchase-orders",
  requireFeature("INVENTORY"),
  purchaseOrderRouter,
);
import { paymentRouter } from "../modules/payments/payment.module";
salonRouter.use("/payments", requireFeature("INVOICES"), paymentRouter);
import { packageRouter } from "../modules/packages/package.module";
salonRouter.use("/packages", packageRouter);
import { reviewRouter } from "../modules/reviews/review.module";
salonRouter.use("/reviews", reviewRouter);
import { couponRouter } from "../modules/coupons/coupon.module";
salonRouter.use("/coupons", couponRouter);
import { offerRouter } from "../modules/offers/offer.module";
salonRouter.use("/offers", offerRouter);
import { galleryRouter } from "../modules/gallery/gallery.module";
salonRouter.use("/gallery", galleryRouter);
import { timeSlotRouter } from "../modules/time-slots/time-slot.module";
salonRouter.use("/time-slots", timeSlotRouter);
import { salonSettingsRouter } from "../modules/salon-settings/salon-settings.module";
salonRouter.use("/salon-settings", salonSettingsRouter);
import { salonAuditLogRouter } from "../modules/salon-audit-logs/salon-audit-log.module";
salonRouter.use("/salon-audit-logs", salonAuditLogRouter);
import { membershipRouter } from "../modules/memberships/membership.module";
salonRouter.use("/memberships", requireFeature("LOYALTY"), membershipRouter);
import { websiteSettingsRouter } from "../modules/website-settings/website-settings.routes";
salonRouter.use(
  "/website-settings",
  requireFeature("WEBSITE_MANAGEMENT"),
  websiteSettingsRouter,
);
import {
  createIntegration,
  getIntegration,
  rotateIntegrationKey,
  updateIntegration,
} from "../controllers/integration.controller";
salonRouter.get(
  "/integrations",
  requireFeature("API_INTEGRATIONS"),
  getIntegration,
);
salonRouter.post(
  "/integrations",
  requireFeature("API_INTEGRATIONS"),
  requireSalonAdmin,
  createIntegration,
);
salonRouter.patch(
  "/integrations/:id",
  requireFeature("API_INTEGRATIONS"),
  requireSalonAdmin,
  updateIntegration,
);
salonRouter.post(
  "/integrations/:id/rotate-key",
  requireFeature("API_INTEGRATIONS"),
  requireSalonAdmin,
  rotateIntegrationKey,
);
