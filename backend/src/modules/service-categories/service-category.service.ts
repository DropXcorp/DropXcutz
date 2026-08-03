import type { Prisma } from "../../../generated/prisma/client";
import type { z } from "zod";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../middleware/error.middleware";
import type {
  serviceCategoryInput,
  serviceCategoryQuery,
} from "../../validators/service-category.validator";
import { serviceCategoryDto } from "./service-category.dto";
import { ServiceCategoryRepository } from "./service-category.repository";
type Input = z.infer<typeof serviceCategoryInput>;
type Query = z.infer<typeof serviceCategoryQuery>;
const data = (input: Partial<Input>): Prisma.ServiceCategoryUpdateInput => ({
  ...(input.name !== undefined && { name: input.name }),
  ...(input.description !== undefined && {
    description: input.description || null,
  }),
  ...(input.image !== undefined && { image: input.image || null }),
  ...(input.isActive !== undefined && { isActive: input.isActive }),
});
export class ServiceCategoryService {
  constructor(private readonly repository = new ServiceCategoryRepository()) {}
  async list(salonId: string, query: Query) {
    const where: Prisma.ServiceCategoryWhereInput = {
      ...(query.search && {
        name: { contains: query.search, mode: "insensitive" },
      }),
      ...(query.isActive && { isActive: query.isActive === "true" }),
    };
    const [items, total] = await Promise.all([
      this.repository.findMany(
        salonId,
        where,
        (query.page - 1) * query.limit,
        query.limit,
        { [query.sortBy]: query.sortOrder },
      ),
      this.repository.count(salonId, where),
    ]);
    return {
      data: items.map(serviceCategoryDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  async get(salonId: string, id: string) {
    return serviceCategoryDto(await this.require(salonId, id));
  }
  async services(salonId: string, id: string) {
    await this.require(salonId, id);
    return prisma.service.findMany({
      where: { salonId, categoryId: id },
      orderBy: { name: "asc" },
    });
  }
  async create(salonId: string, userId: string, input: Input) {
    return prisma.$transaction(async (client) => {
      const item = await new ServiceCategoryRepository(client).create(
        salonId,
        data(input) as Prisma.ServiceCategoryCreateWithoutSalonInput,
      );
      await this.audit(
        client,
        salonId,
        userId,
        "CREATE",
        item.id,
        null,
        serviceCategoryDto(item),
      );
      return serviceCategoryDto(item);
    });
  }
  async update(
    salonId: string,
    userId: string,
    id: string,
    input: Partial<Input>,
  ) {
    return prisma.$transaction(async (client) => {
      const repo = new ServiceCategoryRepository(client);
      const old = await repo.findById(salonId, id);
      if (!old) throw new ApiError(404, "Service category not found.");
      const item = await repo.update(id, data(input));
      await this.audit(
        client,
        salonId,
        userId,
        "UPDATE",
        id,
        serviceCategoryDto(old),
        serviceCategoryDto(item),
      );
      return serviceCategoryDto(item);
    });
  }
  async delete(salonId: string, userId: string, id: string) {
    return prisma.$transaction(async (client) => {
      const repo = new ServiceCategoryRepository(client);
      const old = await repo.findById(salonId, id);
      if (!old) throw new ApiError(404, "Service category not found.");
      await repo.delete(id);
      await this.audit(
        client,
        salonId,
        userId,
        "DELETE",
        id,
        serviceCategoryDto(old),
        null,
      );
    });
  }
  private async require(salonId: string, id: string) {
    const item = await this.repository.findById(salonId, id);
    if (!item) throw new ApiError(404, "Service category not found.");
    return item;
  }
  private audit(
    client: Prisma.TransactionClient,
    salonId: string,
    userId: string,
    action: string,
    entityId: string,
    oldValue: object | null,
    newValue: object | null,
  ) {
    return client.salonAuditLog.create({
      data: {
        salonId,
        userId,
        action,
        entity: "ServiceCategory",
        entityId,
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
      },
    });
  }
}
