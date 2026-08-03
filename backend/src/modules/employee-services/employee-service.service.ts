import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../middleware/error.middleware";
import { employeeSkillDto, serviceEmployeeDto } from "./employee-service.dto";
import { EmployeeServiceRepository } from "./employee-service.repository";


export class EmployeeServiceService {
  constructor(private readonly repository = new EmployeeServiceRepository()) {}
  async assign(
    salonId: string,
    userId: string,
    employeeId: string,
    serviceId: string,
  ) {
    await this.assertOwned(salonId, employeeId, serviceId);
    return prisma.$transaction(async (client) => {
      const repo = new EmployeeServiceRepository(client);
      const assignment = await repo.create(employeeId, serviceId);
      await this.audit(client, salonId, userId, "ASSIGN_SERVICE", employeeId, {
        serviceId,
      });
      return assignment;
    });
  }
  async remove(
    salonId: string,
    userId: string,
    employeeId: string,
    serviceId: string,
  ) {
    await this.assertOwned(salonId, employeeId, serviceId);
    return prisma.$transaction(async (client) => {
      const repo = new EmployeeServiceRepository(client);
      if (!(await repo.findAssignment(employeeId, serviceId)))
        throw new ApiError(404, "Service assignment not found.");
      await repo.delete(employeeId, serviceId);
      await this.audit(client, salonId, userId, "REMOVE_SERVICE", employeeId, {
        serviceId,
      });
    });
  }
  async skills(salonId: string, employeeId: string) {
    await this.assertEmployee(salonId, employeeId);
    return (await this.repository.skills(employeeId)).map(employeeSkillDto);
  }
  async employees(salonId: string, serviceId: string) {
    await this.assertService(salonId, serviceId);
    return (await this.repository.employees(serviceId))
      .filter((item) => item.employee.active)
      .map(serviceEmployeeDto);
  }
  private async assertOwned(
    salonId: string,
    employeeId: string,
    serviceId: string,
  ) {
    await Promise.all([
      this.assertEmployee(salonId, employeeId),
      this.assertService(salonId, serviceId),
    ]);
  }
  private async assertEmployee(salonId: string, id: string) {
    if (
      !(await prisma.employee.findFirst({
        where: { id, salonId },
        select: { id: true },
      }))
    )
      throw new ApiError(404, "Employee not found.");
  }
  private async assertService(salonId: string, id: string) {
    if (
      !(await prisma.service.findFirst({
        where: { id, salonId },
        select: { id: true },
      }))
    )
      throw new ApiError(404, "Service not found.");
  }
  private audit(
    client: Prisma.TransactionClient,
    salonId: string,
    userId: string,
    action: string,
    entityId: string,
    newValue: object,
  ) {
    return client.salonAuditLog.create({
      data: {
        salonId,
        userId,
        action,
        entity: "EmployeeService",
        entityId,
        newValue,
      },
    });
  }
}
