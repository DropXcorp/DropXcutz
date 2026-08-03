import { Router } from "express";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import {
  attendanceSummary,
  checkIn,
  checkOut,
  listAttendance,
  updateAttendance,
} from "./attendance.controller";
/** @openapi
 * /attendance/check-in: { post: { summary: Record employee check-in, tags: [Attendance] } }
 * /attendance/check-out: { post: { summary: Record employee check-out, tags: [Attendance] } }
 */
export const attendanceRouter = Router();
attendanceRouter.get("/", listAttendance);
attendanceRouter.get("/summary", attendanceSummary);
attendanceRouter.post("/check-in", requireSalonAdmin, checkIn);
attendanceRouter.post("/check-out", requireSalonAdmin, checkOut);
attendanceRouter.patch("/:id", requireSalonAdmin, updateAttendance);
