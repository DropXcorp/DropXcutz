import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { created, ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import {
  purchaseOrderInput,
  receivePurchaseOrderInput,
} from "../../validators/purchase-order.validator";


const dto = (item: any) => ({
  id: item.id,
  supplierId: item.supplierId,
  branchId: item.branchId,
  totalAmount: Number(item.totalAmount),
  status: item.status,
  expectedDate: item.expectedDate,
  receivedDate: item.receivedDate,
  items: item.items?.map((line: any) => ({
    inventoryItemId: line.inventoryItemId,
    quantity: line.quantity,
    receivedQuantity: line.receivedQuantity,
    unitCost: Number(line.unitCost),
  })),
});


class PurchaseOrderRepository {
  find(salon: string, id: string) {
    return prisma.purchaseOrder.findFirst({
      where: { id, salonId: salon },
      include: { items: true },
    });
  }
}


class PurchaseOrderService {
  private repo = new PurchaseOrderRepository();
  async list(salon: string) {
    return (
      await prisma.purchaseOrder.findMany({
        where: { salonId: salon },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      })
    ).map(dto);
  }
  async create(
    salon: string,
    user: string,
    input: ReturnType<typeof purchaseOrderInput.parse>,
  ) {
    const [supplier, items, branch] = await Promise.all([
      prisma.supplier.findFirst({
        where: { id: input.supplierId, salonId: salon },
      }),
      prisma.inventoryItem.findMany({
        where: {
          id: { in: input.items.map((x) => x.inventoryItemId) },
          salonId: salon,
        },
      }),
      input.branchId
        ? prisma.branch.findFirst({
            where: { id: input.branchId, salonId: salon },
          })
        : Promise.resolve(true),
    ]);
    if (
      !supplier ||
      items.length !==
        new Set(input.items.map((x) => x.inventoryItemId)).size ||
      !branch
    )
      throw new ApiError(
        400,
        "Supplier, branch, or inventory item is invalid.",
      );
    return prisma.$transaction(async (client) => {
      const totalAmount = input.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0,
      );
      const order = await client.purchaseOrder.create({
        data: {
          salonId: salon,
          supplierId: input.supplierId,
          branchId: input.branchId ?? null,
          expectedDate: input.expectedDate ?? null,
          totalAmount,
          items: { create: input.items },
        },
        include: { items: true },
      });
      await client.salonAuditLog.create({
        data: {
          salonId: salon,
          userId: user,
          action: "CREATE",
          entity: "PurchaseOrder",
          entityId: order.id,
          newValue: dto(order),
        },
      });
      return dto(order);
    });
  }
  async receive(
    salon: string,
    user: string,
    id: string,
    input: ReturnType<typeof receivePurchaseOrderInput.parse>,
  ) {
    return prisma.$transaction(async (client) => {
      const order = await client.purchaseOrder.findFirst({
        where: { id, salonId: salon },
        include: { items: true },
      });
      if (!order) throw new ApiError(404, "Purchase order not found.");
      if (["RECEIVED", "CANCELLED"].includes(order.status))
        throw new ApiError(409, "Purchase order cannot be received.");
      for (const receipt of input.items) {
        const line = order.items.find(
          (x) => x.inventoryItemId === receipt.inventoryItemId,
        );
        if (!line || line.receivedQuantity + receipt.quantity > line.quantity)
          throw new ApiError(400, "Invalid receipt quantity.");
        await client.purchaseOrderItem.update({
          where: {
            purchaseOrderId_inventoryItemId: {
              purchaseOrderId: id,
              inventoryItemId: receipt.inventoryItemId,
            },
          },
          data: { receivedQuantity: { increment: receipt.quantity } },
        });
        await client.inventoryItem.updateMany({
          where: { id: receipt.inventoryItemId, salonId: salon },
          data: { stock: { increment: receipt.quantity } },
        });
      }
      const lines = await client.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });
      const status = lines.every((x) => x.receivedQuantity >= x.quantity)
        ? "RECEIVED"
        : "PARTIALLY_RECEIVED";
      const updated = await client.purchaseOrder.update({
        where: { id },
        data: {
          status,
          receivedDate: status === "RECEIVED" ? new Date() : null,
        },
        include: { items: true },
      });
      await client.salonAuditLog.create({
        data: {
          salonId: salon,
          userId: user,
          action: "RECEIVE",
          entity: "PurchaseOrder",
          entityId: id,
          newValue: dto(updated),
        },
      });
      return dto(updated);
    });
  }
}


const service = new PurchaseOrderService();
const user = (res: Response) => String(res.locals.user.id);
export const purchaseOrderRouter = Router();
purchaseOrderRouter.get("/", async (_req, res) =>
  ok(res, await service.list(salonId(res))),
);


purchaseOrderRouter.post("/", requireSalonAdmin, async (req, res) =>
  created(
    res,
    await service.create(
      salonId(res),
      user(res),
      purchaseOrderInput.parse(req.body),
    ),
  ),
);


purchaseOrderRouter.post("/:id/receive", requireSalonAdmin, async (req, res) =>
  ok(
    res,
    await service.receive(
      salonId(res),
      user(res),
      String(req.params.id),
      receivePurchaseOrderInput.parse(req.body),
    ),
  ),
);
