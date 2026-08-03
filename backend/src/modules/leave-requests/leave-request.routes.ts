import { Router } from "express";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import {
  applyLeave,
  listLeaveRequests,
  updateLeave,
} from "./leave-request.controller";
/** @openapi
 * /leave-requests: { get: { summary: List leave requests, tags: [Leave Requests] }, post: { summary: Apply for leave, tags: [Leave Requests] } }
 */
export const leaveRequestRouter = Router();
leaveRequestRouter.get("/", listLeaveRequests);
leaveRequestRouter.post("/", requireSalonAdmin, applyLeave);
leaveRequestRouter.patch("/:id", requireSalonAdmin, updateLeave);
