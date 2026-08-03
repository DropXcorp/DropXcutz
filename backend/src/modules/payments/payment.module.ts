import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { created, ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import { paymentInput, paymentQuery } from "../../validators/payment.validator";
const dto = (x: any) => ({ ...x, amount: Number(x.amount) });
const user = (r: Response) => String(r.locals.user.id);
export const paymentRouter = Router();


async function owns(
  salon: string,
  input: ReturnType<typeof paymentInput.parse>,
) {
  const [invoice, appointment, customer] = await Promise.all([
    input.invoiceId
      ? prisma.invoice.findFirst({
          where: { id: input.invoiceId, salonId: salon },
        })
      : true,
    input.appointmentId
      ? prisma.appointment.findFirst({
          where: { id: input.appointmentId, salonId: salon },
        })
      : true,
    input.customerId
      ? prisma.customer.findFirst({
          where: { id: input.customerId, salonId: salon },
        })
      : true,
  ]);
  if (!invoice || !appointment || !customer)
    throw new ApiError(404, "Payment relation not found for this salon.");
}


paymentRouter.get("/", async (req: Request, res: Response) => {
  const q = paymentQuery.parse(req.query);
  const where = {
    ...(q.method && { method: q.method }),
    ...(q.status && { status: q.status }),
    OR: [
      { invoice: { salonId: salonId(res) } },
      { appointment: { salonId: salonId(res) } },
      { customer: { salonId: salonId(res) } },
    ],
  };
  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.payment.count({ where }),
  ]);
  ok(res, {
    data: data.map(dto),
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.ceil(total / q.limit),
    },
  });
});


paymentRouter.post("/", requireSalonAdmin, async (req, res) => {
  const input = paymentInput.parse(req.body);
  await owns(salonId(res), input);
  const item = await prisma.$transaction(async (client) => {
    const payment = await client.payment.create({
      data: {
        ...input,
        invoiceId: input.invoiceId ?? null,
        appointmentId: input.appointmentId ?? null,
        customerId: input.customerId ?? null,
        transactionId: input.transactionId || null,
      },
    });
    if (input.invoiceId)
      await client.invoice.update({
        where: { id: input.invoiceId },
        data: { amountPaid: { increment: input.amount } },
      });
    if (input.appointmentId)
      await client.appointment.update({
        where: { id: input.appointmentId },
        data: { amountPaid: { increment: input.amount } },
      });
    await client.salonAuditLog.create({
      data: {
        salonId: salonId(res),
        userId: user(res),
        action: "CREATE",
        entity: "Payment",
        entityId: payment.id,
        newValue: dto(payment),
      },
    });
    return payment;
  });
  created(res, dto(item));
});


paymentRouter.post("/:id/refund", requireSalonAdmin, async (req, res) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: String(req.params.id),
      OR: [
        { invoice: { salonId: salonId(res) } },
        { appointment: { salonId: salonId(res) } },
        { customer: { salonId: salonId(res) } },
      ],
    },
  });
  if (!payment) throw new ApiError(404, "Payment not found.");
  if (payment.status === "REFUNDED")
    throw new ApiError(409, "Payment is already refunded.");
  const item = await prisma.$transaction(async (client) => {
    const updated = await client.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });
    await client.salonAuditLog.create({
      data: {
        salonId: salonId(res),
        userId: user(res),
        action: "REFUND",
        entity: "Payment",
        entityId: payment.id,
        newValue: dto(updated),
      },
    });
    return updated;
  });
  ok(res, dto(item));
});
