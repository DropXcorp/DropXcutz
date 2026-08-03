import type { Request, Response } from "express";
import { created, ok, salonId } from "../../controllers/http.controller";
import {
  attendancePatch,
  attendanceQuery,
  checkInInput,
  checkOutInput,
} from "../../validators/attendance.validator";
import { AttendanceService } from "./attendance.service";
const service = new AttendanceService();
const userId = (response: Response) => String(response.locals.user.id);
export async function checkIn(request: Request, response: Response) {
  created(
    response,
    await service.checkIn(
      salonId(response),
      userId(response),
      checkInInput.parse(request.body),
    ),
  );
}
export async function checkOut(request: Request, response: Response) {
  const input = checkOutInput.parse(request.body);
  ok(
    response,
    await service.checkOut(
      salonId(response),
      userId(response),
      input.attendanceId,
      input.checkOut,
    ),
  );
}
export async function listAttendance(request: Request, response: Response) {
  ok(
    response,
    await service.list(salonId(response), attendanceQuery.parse(request.query)),
  );
}
export async function updateAttendance(request: Request, response: Response) {
  ok(
    response,
    await service.update(
      salonId(response),
      userId(response),
      String(request.params.id),
      attendancePatch.parse(request.body),
    ),
  );
}
export async function attendanceSummary(request: Request, response: Response) {
  const month = String(request.query.month ?? "");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error("A valid month query is required.");
  ok(response, await service.summary(salonId(response), month));
}
