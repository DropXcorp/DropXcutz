import type { Prisma } from "../../../generated/prisma/client";
import type { z } from "zod";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../middleware/error.middleware";
import type {
  branchInput,
  branchListQuery,
} from "../../validators/branch.validator";
import { branchDto } from "./branch.dto";
import { BranchRepository } from "./branch.repository";
type BranchInput = z.infer<typeof branchInput>;
type BranchListQuery = z.infer<typeof branchListQuery>;
const nullable = <T>(value: T | null | undefined) => value || null;
const dataFor = (input: Partial<BranchInput>): Prisma.BranchUpdateInput => ({
  ...(input.name !== undefined && { name: input.name }),
  ...(input.code !== undefined && { code: input.code }),
  ...(input.phone !== undefined && { phone: nullable(input.phone) }),
  ...(input.email !== undefined && { email: nullable(input.email) }),
  ...(input.address !== undefined && { address: nullable(input.address) }),
  ...(input.city !== undefined && { city: nullable(input.city) }),
  ...(input.state !== undefined && { state: nullable(input.state) }),
  ...(input.postalCode !== undefined && {
    postalCode: nullable(input.postalCode),
  }),
  ...(input.latitude !== undefined && { latitude: input.latitude }),
  ...(input.longitude !== undefined && { longitude: input.longitude }),
  ...(input.openingTime !== undefined && { openingTime: input.openingTime }),
  ...(input.closingTime !== undefined && { closingTime: input.closingTime }),
  ...(input.isActive !== undefined && {
    isActive: input.isActive,
    status: input.isActive ? "ACTIVE" : "INACTIVE",
  }),
});
export class BranchService {
  constructor(private readonly repository = new BranchRepository()) {}
  async list(salonId: string, query: BranchListQuery) {
    const where: Prisma.BranchWhereInput = {
      ...(query.search && {
        OR: ["name", "code", "city"].map((field) => ({
          [field]: { contains: query.search, mode: "insensitive" },
        })),
      }),
      ...(query.isActive && { isActive: query.isActive === "true" }),
    };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.repository.findMany(salonId, where, skip, query.limit, {
        [query.sortBy]: query.sortOrder,
      }),
      this.repository.count(salonId, where),
    ]);
    return {
      data: items.map(branchDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
  async get(salonId: string, id: string) {
    const branch = await this.requireBranch(salonId, id);
    const [employeeCount, appointmentCount, inventoryCount] =
      await this.repository.statistics(salonId, id);
    return {
      ...branchDto(branch),
      statistics: { employeeCount, appointmentCount, inventoryCount },
    };
  }
  async create(salonId: string, actorId: string, input: BranchInput) {
    return prisma.$transaction(async (client) => {
      const repository = new BranchRepository(client);
      const branch = await repository.create(
        salonId,
        dataFor(input) as Prisma.BranchCreateWithoutSalonInput,
      );
      await this.audit(
        client,
        salonId,
        actorId,
        "CREATE",
        branch.id,
        null,
        branchDto(branch),
      );
      return branchDto(branch);
    });
  }
  async update(
    salonId: string,
    actorId: string,
    id: string,
    input: Partial<BranchInput>,
  ) {
    return prisma.$transaction(async (client) => {
      const repository = new BranchRepository(client);
      const current = await repository.findById(salonId, id);
      if (!current) throw new ApiError(404, "Branch not found.");
      const branch = await repository.update(id, dataFor(input));
      await this.audit(
        client,
        salonId,
        actorId,
        "UPDATE",
        id,
        branchDto(current),
        branchDto(branch),
      );
      return branchDto(branch);
    });
  }
  setActive(salonId: string, actorId: string, id: string, isActive: boolean) {
    return this.update(salonId, actorId, id, { isActive });
  }
  async delete(salonId: string, actorId: string, id: string) {
    return prisma.$transaction(async (client) => {
      const repository = new BranchRepository(client);
      const current = await repository.findById(salonId, id);
      if (!current) throw new ApiError(404, "Branch not found.");
      await repository.delete(id);
      await this.audit(
        client,
        salonId,
        actorId,
        "DELETE",
        id,
        branchDto(current),
        null,
      );
    });
  }
  private async requireBranch(salonId: string, id: string) {
    const branch = await this.repository.findById(salonId, id);
    if (!branch) throw new ApiError(404, "Branch not found.");
    return branch;
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
        entity: "Branch",
        entityId,
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
      },
    });
  }
}
