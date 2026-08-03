import { Router } from "express";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import {
  assignEmployeeService,
  employeeSkills,
  removeEmployeeService,
  serviceEmployees,
} from "./employee-service.controller";
/** @openapi
 * /employee-services: { post: { summary: Assign a service to an employee, tags: [Employee Services] } }
 */
export const employeeServiceRouter = Router();
employeeServiceRouter.get("/employees/:employeeId", employeeSkills);
employeeServiceRouter.get("/services/:serviceId", serviceEmployees);
employeeServiceRouter.post("/", requireSalonAdmin, assignEmployeeService);
employeeServiceRouter.delete(
  "/:employeeId/:serviceId",
  requireSalonAdmin,
  removeEmployeeService,
);
