import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
type Client = PrismaClient | Prisma.TransactionClient;


export class ServiceCategoryRepository {
  constructor(private readonly db: Client = prisma) {}
  findMany(
    salonId: string,
    where: Prisma.ServiceCategoryWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.ServiceCategoryOrderByWithRelationInput,
  ) {
    return this.db.serviceCategory.findMany({
      where: { salonId, ...where },
      skip,
      take,
      orderBy,
      include: { _count: { select: { services: true } } },
    });
  }
  count(salonId: string, where: Prisma.ServiceCategoryWhereInput) {
    return this.db.serviceCategory.count({ where: { salonId, ...where } });
  }
  findById(salonId: string, id: string) {
    return this.db.serviceCategory.findFirst({
      where: { salonId, id },
      include: { _count: { select: { services: true } } },
    });
  }
  create(salonId: string, data: Prisma.ServiceCategoryCreateWithoutSalonInput) {
    return this.db.serviceCategory.create({
      data: { ...data, salon: { connect: { id: salonId } } },
      include: { _count: { select: { services: true } } },
    });
  }
  update(id: string, data: Prisma.ServiceCategoryUpdateInput) {
    return this.db.serviceCategory.update({
      where: { id },
      data,
      include: { _count: { select: { services: true } } },
    });
  }
  delete(id: string) {
    return this.db.serviceCategory.delete({ where: { id } });
  }
}
