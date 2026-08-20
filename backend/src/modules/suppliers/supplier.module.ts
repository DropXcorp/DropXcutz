import type { Request, Response } from "express";
import { Router } from "express";
import type { Prisma, PrismaClient } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { created, ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import {
  supplierInput,
  supplierPatch,
  supplierQuery,
} from "../../validators/supplier.validator";

type Client = PrismaClient | Prisma.TransactionClient;
type SupplierInput = ReturnType<typeof supplierInput.parse>;
const dto = (item: any) => ({
  id: item.id,
  name: item.name,
  contactPerson: item.contactPerson,
  phone: item.phone,
  email: item.email,
  gstNumber: item.gstNumber,
  address: item.address,
  city: item.city,
  state: item.state,
  notes: item.notes,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});


const data = (input: Partial<SupplierInput>): Prisma.SupplierUpdateInput => ({
  ...(input.name !== undefined && { name: input.name }),
  ...(input.contactPerson !== undefined && { contactPerson: input.contactPerson || null }),
  ...(input.phone !== undefined && { phone: input.phone || null }),
  ...(input.email !== undefined && { email: input.email || null }),
  ...(input.gstNumber !== undefined && { gstNumber: input.gstNumber || null }),
  ...(input.address !== undefined && { address: input.address || null }),
  ...(input.city !== undefined && { city: input.city || null }),
  ...(input.state !== undefined && { state: input.state || null }),
  ...(input.notes !== undefined && { notes: input.notes || null }),
});

class SupplierRepository {
  constructor(private readonly db: Client = prisma) {}
  find(salonId: string, id: string) {
    return this.db.supplier.findFirst({ where: { salonId, id } });
  }
  create(salonId: string, value: Prisma.SupplierCreateWithoutSalonInput) {
    return this.db.supplier.create({
      data: { ...value, salon: { connect: { id: salonId } } },
    });
  }
  update(id: string, value: Prisma.SupplierUpdateInput) {
    return this.db.supplier.update({ where: { id }, data: value });
  }
  delete(id: string) {
    return this.db.supplier.delete({ where: { id } });
  }
}


class SupplierService {
  constructor(private readonly repository = new SupplierRepository()) {}
  async list(
    salonIdValue: string,
    query: ReturnType<typeof supplierQuery.parse>,
  ) {
    const where: Prisma.SupplierWhereInput = query.search
      ? {
          OR: ["name", "phone", "email", "city"].map((field) => ({
            [field]: { contains: query.search, mode: "insensitive" },
          })),
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where: { salonId: salonIdValue, ...where },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.supplier.count({ where: { salonId: salonIdValue, ...where } }),
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
  async get(salonIdValue: string, id: string) {
    return dto(await this.require(salonIdValue, id));
  }
  async create(salonIdValue: string, userId: string, input: SupplierInput) {
    return prisma.$transaction(async (client) => {
      const item = await new SupplierRepository(client).create(
        salonIdValue,
        data(input) as Prisma.SupplierCreateWithoutSalonInput,
      );
      await this.audit(
        client,
        salonIdValue,
        userId,
        "CREATE",
        item.id,
        dto(item),
      );
      return dto(item);
    });
  }
  async update(
    salonIdValue: string,
    userId: string,
    id: string,
    input: Partial<SupplierInput>,
  ) {
    return prisma.$transaction(async (client) => {
      const repo = new SupplierRepository(client);
      await this.require(salonIdValue, id);
      const item = await repo.update(id, data(input));
      await this.audit(client, salonIdValue, userId, "UPDATE", id, dto(item));
      return dto(item);
    });
  }
  async delete(salonIdValue: string, userId: string, id: string) {
    return prisma.$transaction(async (client) => {
      const repo = new SupplierRepository(client);
      const item = await repo.find(salonIdValue, id);
      if (!item) throw new ApiError(404, "Supplier not found.");
      await repo.delete(id);
      await this.audit(client, salonIdValue, userId, "DELETE", id, dto(item));
    });
  }
  private async require(salonIdValue: string, id: string) {
    const item = await this.repository.find(salonIdValue, id);
    if (!item) throw new ApiError(404, "Supplier not found.");
    return item;
  }
  private audit(
    client: Prisma.TransactionClient,
    salonIdValue: string,
    userId: string,
    action: string,
    entityId: string,
    newValue: object,
  ) {
    return client.salonAuditLog.create({
      data: {
        salonId: salonIdValue,
        userId,
        action,
        entity: "Supplier",
        entityId,
        newValue,
      },
    });
  }
}


const service = new SupplierService();
const userId = (response: Response) => String(response.locals.user.id);
export const supplierRouter = Router();


supplierRouter.get("/", async (request: Request, response: Response) =>
  ok(
    response,
    await service.list(salonId(response), supplierQuery.parse(request.query)),
  ),
);


supplierRouter.get("/:id", async (request: Request, response: Response) =>
  ok(response, await service.get(salonId(response), String(request.params.id))),
);


supplierRouter.post(
  "/",
  requireSalonAdmin,
  async (request: Request, response: Response) =>
    created(
      response,
      await service.create(
        salonId(response),
        userId(response),
        supplierInput.parse(request.body),
      ),
    ),
);


supplierRouter.patch(
  "/:id",
  requireSalonAdmin,
  async (request: Request, response: Response) =>
    ok(
      response,
      await service.update(
        salonId(response),
        userId(response),
        String(request.params.id),
        supplierPatch.parse(request.body),
      ),
    ),
);


supplierRouter.delete(
  "/:id",
  requireSalonAdmin,
  async (request: Request, response: Response) => {
    await service.delete(
      salonId(response),
      userId(response),
      String(request.params.id),
    );
    response.status(204).end();
  },
);
