import type { Request, Response } from "express";
import { created, ok, salonId } from "../../controllers/http.controller";
import {
  employeeServiceInput,
  employeeServiceParams,
} from "../../validators/employee-service.validator";
import { EmployeeServiceService } from "./employee-service.service";
const service = new EmployeeServiceService();
const userId = (response: Response) => String(response.locals.user.id);


export async function assignEmployeeService(
  request: Request,
  response: Response,
) {
  const input = employeeServiceInput.parse(request.body);
  created(
    response,
    await service.assign(
      salonId(response),
      userId(response),
      input.employeeId,
      input.serviceId,
    ),
  );
}


export async function removeEmployeeService(
  request: Request,
  response: Response,
) {
  const input = employeeServiceParams.parse(request.params);
  await service.remove(
    salonId(response),
    userId(response),
    input.employeeId,
    input.serviceId,
  );
  response.status(204).end();
}


export async function employeeSkills(request: Request, response: Response) {
  ok(
    response,
    await service.skills(salonId(response), String(request.params.employeeId)),
  );
}


export async function serviceEmployees(request: Request, response: Response) {
  ok(
    response,
    await service.employees(
      salonId(response),
      String(request.params.serviceId),
    ),
  );
}
