import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
type DatabaseClient = PrismaClient | Prisma.TransactionClient;
export class BranchRepository {
  constructor(private readonly db: DatabaseClient = prisma) {}
  findMany(
    salonId: string,
    where: Prisma.BranchWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.BranchOrderByWithRelationInput,
  ) {
    return this.db.branch.findMany({
      where: { salonId, ...where },
      skip,
      take,
      orderBy,
    });
  }
  count(salonId: string, where: Prisma.BranchWhereInput) {
    return this.db.branch.count({ where: { salonId, ...where } });
  }
  findById(salonId: string, id: string) {
    return this.db.branch.findFirst({ where: { id, salonId } });
  }
  create(salonId: string, data: Prisma.BranchCreateWithoutSalonInput) {
    return this.db.branch.create({
      data: { ...data, salon: { connect: { id: salonId } } },
    });
  }
  update(id: string, data: Prisma.BranchUpdateInput) {
    return this.db.branch.update({ where: { id }, data });
  }
  delete(id: string) {
    return this.db.branch.delete({ where: { id } });
  }
  statistics(salonId: string, branchId: string) {
    return Promise.all([
      this.db.employee.count({ where: { salonId, branchId } }),
      this.db.appointment.count({ where: { salonId, branchId } }),
      this.db.inventoryItem.count({ where: { salonId, branchId } }),
    ]);
  }
}
