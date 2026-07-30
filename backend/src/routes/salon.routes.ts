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
