import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
type Client = PrismaClient | Prisma.TransactionClient;
export class LeaveRequestRepository {
  constructor(private readonly db: Client = prisma) {}
  findMany(where: Prisma.LeaveRequestWhereInput, skip: number, take: number) {
    return this.db.leaveRequest.findMany({
      where,
      include: { employee: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }
  count(where: Prisma.LeaveRequestWhereInput) {
    return this.db.leaveRequest.count({ where });
  }
  find(salonId: string, id: string) {
    return this.db.leaveRequest.findFirst({
      where: { id, employee: { salonId } },
      include: { employee: { select: { name: true } } },
    });
  }
  create(data: Prisma.LeaveRequestCreateInput) {
    return this.db.leaveRequest.create({
      data,
      include: { employee: { select: { name: true } } },
    });
  }
  update(id: string, data: Prisma.LeaveRequestUpdateInput) {
    return this.db.leaveRequest.update({
      where: { id },
      data,
      include: { employee: { select: { name: true } } },
    });
  }
}
