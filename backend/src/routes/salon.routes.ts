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
import { requireAuthenticatedSalonUser } from "../middleware/session.middleware";
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
salonRouter.post("/customers", createCustomer);
salonRouter.patch("/customers/:id", updateCustomer);
salonRouter.delete("/customers/:id", deleteCustomer);
salonRouter.post("/employees", createEmployee);
salonRouter.patch("/employees/:id", updateEmployee);
salonRouter.delete("/employees/:id", deleteEmployee);
salonRouter.post("/inventory", createInventory);
salonRouter.patch("/inventory/:id", updateInventory);
salonRouter.delete("/inventory/:id", deleteInventory);
salonRouter.post("/services", createService);
salonRouter.patch("/services/:id", updateService);
salonRouter.delete("/services/:id", deleteService);
salonRouter.post("/appointments", createAppointment);
salonRouter.put("/appointments/:id", updateAppointment);
salonRouter.delete("/appointments/:id", deleteAppointment);
salonRouter.post("/invoices", createInvoiceController);
salonRouter.patch("/invoices/:id", updateInvoice);
salonRouter.delete("/invoices/:id", deleteInvoice);
salonRouter.post("/payroll", createPayrollController);
salonRouter.patch("/payroll/:id", updatePayroll);
salonRouter.delete("/payroll/:id", deletePayroll);
salonRouter.put("/settings", updateSettings);
salonRouter.get("/notifications", listNotifications);
salonRouter.patch("/notifications/:id/read", markNotificationRead);
salonRouter.post("/loyalty/:customerId/adjust", adjustLoyalty);
import { branchRouter } from "../modules/branches/branch.routes";
salonRouter.use("/branches", branchRouter);
import { serviceCategoryRouter } from "../modules/service-categories/service-category.routes";
salonRouter.use("/service-categories", serviceCategoryRouter);
import { employeeServiceRouter } from "../modules/employee-services/employee-service.routes";
salonRouter.use("/employee-services", employeeServiceRouter);
import { attendanceRouter } from "../modules/attendance/attendance.routes";
salonRouter.use("/attendance", attendanceRouter);
import { leaveRequestRouter } from "../modules/leave-requests/leave-request.routes";
salonRouter.use("/leave-requests", leaveRequestRouter);
import { supplierRouter } from "../modules/suppliers/supplier.module";
salonRouter.use("/suppliers", supplierRouter);
import { expenseRouter } from "../modules/expenses/expense.module";
salonRouter.use("/expenses", expenseRouter);
import { purchaseOrderRouter } from "../modules/purchase-orders/purchase-order.module";
salonRouter.use("/purchase-orders", purchaseOrderRouter);
import { paymentRouter } from "../modules/payments/payment.module";
salonRouter.use("/payments", paymentRouter);
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
salonRouter.use("/memberships", membershipRouter);
