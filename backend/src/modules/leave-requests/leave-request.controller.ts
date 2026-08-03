import type { Request, Response } from "express";
import { created, ok, salonId } from "../../controllers/http.controller";
import {
  leaveApplyInput,
  leaveQuery,
  leaveStatusInput,
} from "../../validators/leave-request.validator";
import { LeaveRequestService } from "./leave-request.service";
const service = new LeaveRequestService();
const userId = (response: Response) => String(response.locals.user.id);
export async function listLeaveRequests(request: Request, response: Response) {
  ok(
    response,
    await service.list(salonId(response), leaveQuery.parse(request.query)),
  );
}
export async function applyLeave(request: Request, response: Response) {
  created(
    response,
    await service.apply(
      salonId(response),
      userId(response),
      leaveApplyInput.parse(request.body),
    ),
  );
}
export async function updateLeave(request: Request, response: Response) {
  ok(
    response,
    await service.transition(
      salonId(response),
      userId(response),
      String(request.params.id),
      leaveStatusInput.parse(request.body).status,
    ),
  );
}
