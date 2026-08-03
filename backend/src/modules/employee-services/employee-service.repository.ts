import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
type Client = PrismaClient | Prisma.TransactionClient;


export class EmployeeServiceRepository {
  constructor(private readonly db: Client = prisma) {}
  findAssignment(employeeId: string, serviceId: string) {
    return this.db.employeeService.findUnique({
      where: { employeeId_serviceId: { employeeId, serviceId } },
    });
  }
  create(employeeId: string, serviceId: string) {
    return this.db.employeeService.create({ data: { employeeId, serviceId } });
  }
  delete(employeeId: string, serviceId: string) {
    return this.db.employeeService.delete({
      where: { employeeId_serviceId: { employeeId, serviceId } },
    });
  }
  skills(employeeId: string) {
    return this.db.employeeService.findMany({
      where: { employeeId },
      include: { service: true },
      orderBy: { service: { name: "asc" } },
    });
  }
  employees(serviceId: string) {
    return this.db.employeeService.findMany({
      where: { serviceId },
      include: { employee: true },
      orderBy: { employee: { name: "asc" } },
    });
  }
}
