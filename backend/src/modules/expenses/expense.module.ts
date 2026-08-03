import type { Request, Response } from "express";
import { Router } from "express";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { created, ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import {
  expenseInput,
  expensePatch,
  expenseQuery,
} from "../../validators/expense.validator";
const dto = (item: any) => ({ ...item, amount: Number(item.amount) });
const userId = (response: Response) => String(response.locals.user.id);
class ExpenseRepository {
  find(salonIdValue: string, id: string) {
    return prisma.expense.findFirst({ where: { salonId: salonIdValue, id } });
  }
}
class ExpenseService {
  private readonly repository = new ExpenseRepository();
  async list(
    salonIdValue: string,
    query: ReturnType<typeof expenseQuery.parse>,
  ) {
    const range = query.month ? this.month(query.month) : undefined;
    const where: Prisma.ExpenseWhereInput = {
      salonId: salonIdValue,
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.category && { category: query.category }),
      ...(range && { date: range }),
    };
    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.expense.count({ where }),
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
  async report(salonIdValue: string, month: string) {
    const where = { salonId: salonIdValue, date: this.month(month) };
    const [total, groups] = await Promise.all([
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
      prisma.expense.groupBy({
        by: ["category"],
        where,
        _sum: { amount: true },
      }),
    ]);
    return {
      month,
      totalAmount: Number(total._sum.amount ?? 0),
      byCategory: groups.map((group) => ({
        category: group.category,
        amount: Number(group._sum.amount ?? 0),
      })),
    };
  }
  async create(
    salonIdValue: string,
    actor: string,
    input: ReturnType<typeof expenseInput.parse>,
  ) {
    if (input.branchId) await this.branch(salonIdValue, input.branchId);
    return prisma.$transaction(async (client) => {
      const item = await client.expense.create({
        data: {
          ...input,
          salonId: salonIdValue,
          date: input.date ?? new Date(),
          branchId: input.branchId ?? null,
          notes: input.notes || null,
        },
      });
      await this.audit(
        client,
        salonIdValue,
        actor,
        "CREATE",
        item.id,
        dto(item),
      );
      return dto(item);
    });
  }
  async update(
    salonIdValue: string,
    actor: string,
    id: string,
    input: ReturnType<typeof expensePatch.parse>,
  ) {
    if (input.branchId) await this.branch(salonIdValue, input.branchId);
    return prisma.$transaction(async (client) => {
      if (!(await this.repository.find(salonIdValue, id)))
        throw new ApiError(404, "Expense not found.");
      const item = await client.expense.update({
        where: { id },
        data: {
          ...input,
          branchId:
            input.branchId === undefined ? undefined : input.branchId || null,
          notes: input.notes === undefined ? undefined : input.notes || null,
        },
      });
      await this.audit(client, salonIdValue, actor, "UPDATE", id, dto(item));
      return dto(item);
    });
  }
  async delete(salonIdValue: string, actor: string, id: string) {
    return prisma.$transaction(async (client) => {
      const item = await this.repository.find(salonIdValue, id);
      if (!item) throw new ApiError(404, "Expense not found.");
      await client.expense.delete({ where: { id } });
      await this.audit(client, salonIdValue, actor, "DELETE", id, dto(item));
    });
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
  private async branch(salonIdValue: string, id: string) {
    if (
      !(await prisma.branch.findFirst({ where: { id, salonId: salonIdValue } }))
    )
      throw new ApiError(404, "Branch not found.");
  }
  private audit(
    client: Prisma.TransactionClient,
    salonIdValue: string,
    actor: string,
    action: string,
    entityId: string,
    newValue: object,
  ) {
    return client.salonAuditLog.create({
      data: {
        salonId: salonIdValue,
        userId: actor,
        action,
        entity: "Expense",
        entityId,
        newValue,
      },
    });
  }
}
const service = new ExpenseService();
export const expenseRouter = Router();
expenseRouter.get("/", async (req: Request, res: Response) =>
  ok(res, await service.list(salonId(res), expenseQuery.parse(req.query))),
);
expenseRouter.get("/reports/monthly", async (req: Request, res: Response) => {
  const month = String(req.query.month ?? "");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new ApiError(400, "A valid month query is required.");
  ok(res, await service.report(salonId(res), month));
});
expenseRouter.post(
  "/",
  requireSalonAdmin,
  async (req: Request, res: Response) =>
    created(
      res,
      await service.create(
        salonId(res),
        userId(res),
        expenseInput.parse(req.body),
      ),
    ),
);
expenseRouter.patch(
  "/:id",
  requireSalonAdmin,
  async (req: Request, res: Response) =>
    ok(
      res,
      await service.update(
        salonId(res),
        userId(res),
        String(req.params.id),
        expensePatch.parse(req.body),
      ),
    ),
);
expenseRouter.delete(
  "/:id",
  requireSalonAdmin,
  async (req: Request, res: Response) => {
    await service.delete(salonId(res), userId(res), String(req.params.id));
    res.status(204).end();
  },
);
