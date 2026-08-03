import type { Prisma } from "../../../generated/prisma/client";
import type { z } from "zod";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../middleware/error.middleware";
import type {
  leaveApplyInput,
  leaveQuery,
} from "../../validators/leave-request.validator";
import { LeaveRequestRepository } from "./leave-request.repository";
type Apply = z.infer<typeof leaveApplyInput>;
type Query = z.infer<typeof leaveQuery>;


const dto = (item: {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  employee: { name: string };
}) => ({
  id: item.id,
  employeeId: item.employeeId,
  employeeName: item.employee.name,
  startDate: item.startDate,
  endDate: item.endDate,
  reason: item.reason,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});


export class LeaveRequestService {
  constructor(private readonly repository = new LeaveRequestRepository()) {}
  async list(salonId: string, query: Query) {
    const range = query.month ? this.month(query.month) : undefined;
    const where: Prisma.LeaveRequestWhereInput = {
      employee: { salonId },
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.status && { status: query.status }),
      ...(range && {
        startDate: { lt: range.lt },
        endDate: { gte: range.gte },
      }),
    };
    const [items, total] = await Promise.all([
      this.repository.findMany(
        where,
        (query.page - 1) * query.limit,
        query.limit,
      ),
      this.repository.count(where),
    ]);
    return {
      data: items.map(dto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  async apply(salonId: string, userId: string, input: Apply) {
    await this.employee(salonId, input.employeeId);
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: input.employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: input.endDate },
        endDate: { gte: input.startDate },
      },
    });
    if (overlap)
      throw new ApiError(409, "An overlapping leave request already exists.");
    return prisma.$transaction(async (client) => {
      const item = await new LeaveRequestRepository(client).create({
        employee: { connect: { id: input.employeeId } },
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason || null,
      });
      await this.audit(client, salonId, userId, "APPLY", item.id, dto(item));
      return dto(item);
    });
  }
  async transition(
    salonId: string,
    userId: string,
    id: string,
    status: "APPROVED" | "REJECTED" | "CANCELLED",
  ) {
    return prisma.$transaction(async (client) => {
      const repo = new LeaveRequestRepository(client);
      const current = await repo.find(salonId, id);
      if (!current) throw new ApiError(404, "Leave request not found.");
      if (current.status !== "PENDING")
        throw new ApiError(409, "Only pending leave requests can be updated.");
      const item = await repo.update(id, { status });
      await this.audit(client, salonId, userId, status, id, dto(item));
      return dto(item);
    });
  }
  private async employee(salonId: string, id: string) {
    if (
      !(await prisma.employee.findFirst({
        where: { id, salonId },
        select: { id: true },
      }))
    )
      throw new ApiError(404, "Employee not found.");
  }
  private month(value: string) {
    const start = new Date(`${value}-01T00:00:00.000Z`);
    return {
      gte: start,
      lt: new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
      ),
    };
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
        entity: "LeaveRequest",
        entityId,
        newValue,
      },
    });
  }
}
