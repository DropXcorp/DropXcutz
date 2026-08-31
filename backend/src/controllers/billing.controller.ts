import type { Request, Response } from "express";
import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "../../generated/prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { created, ok } from "./http.controller";
import { ApiError } from "../middleware/error.middleware";
import { createRazorpayPaymentLink, verifyRazorpayWebhook } from "../services/razorpay.service";

const invoiceInput = z.object({
  salonId: z.string().min(1),
  subscriptionId: z.string().min(1).optional().nullable(),
  subtotal: z.coerce.number().positive().max(999_999_999.99),
  taxAmount: z.coerce.number().min(0).max(999_999_999.99).default(0),
  dueAt: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(5_000).optional().nullable(),
});

const invoiceNumber = () => `PLT-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

export async function listPlatformInvoices(_request: Request, response: Response) {
  ok(response, await prisma.platformInvoice.findMany({
    include: { salon: { select: { id: true, salonName: true, code: true } }, subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  }));
}

export async function createPlatformInvoice(request: Request, response: Response) {
  const input = invoiceInput.parse(request.body);
  const salon = await prisma.salon.findUnique({ where: { id: input.salonId } });
  if (!salon) throw new ApiError(404, "Salon not found.");
  if (input.subscriptionId) {
    const subscription = await prisma.subscription.findFirst({ where: { id: input.subscriptionId, salonId: salon.id } });
    if (!subscription) throw new ApiError(400, "Subscription does not belong to this salon.");
  }
  const totalAmount = input.subtotal + input.taxAmount;
  const invoice = await prisma.platformInvoice.create({
    data: {
      salonId: salon.id,
      subscriptionId: input.subscriptionId ?? null,
      invoiceNumber: invoiceNumber(),
      subtotal: input.subtotal,
      taxAmount: input.taxAmount,
      totalAmount,
      dueAt: input.dueAt ?? null,
      notes: input.notes ?? null,
      status: "OPEN",
    },
  });
  const paymentLink = await createRazorpayPaymentLink({
    referenceId: invoice.id,
    amountPaise: Math.round(totalAmount * 100),
    currency: salon.currency,
    description: `DropXCutz platform invoice ${invoice.invoiceNumber}`,
    customer: { name: salon.adminName, email: salon.adminEmail, contact: salon.phone },
    expiresAt: input.dueAt,
  });
  const saved = await prisma.platformInvoice.update({
    where: { id: invoice.id },
    data: { razorpayPaymentLinkId: paymentLink.id, paymentUrl: paymentLink.short_url },
  });
  created(response, saved);
}

export async function handleRazorpayWebhook(request: Request, response: Response) {
  const rawBody = request.body as Buffer;
  if (!Buffer.isBuffer(rawBody) || !verifyRazorpayWebhook(rawBody, request.header("x-razorpay-signature") ?? undefined)) {
    throw new ApiError(401, "Invalid Razorpay webhook signature.");
  }
  const event = JSON.parse(rawBody.toString("utf8")) as { event?: string; payload?: { payment_link?: { entity?: { id?: string; status?: string; amount_paid?: number; payment_id?: string } } } };
  const eventId = request.header("x-razorpay-event-id") ?? createRazorpayEventId(rawBody);
  try {
    await prisma.razorpayWebhookEvent.create({ data: { eventId, eventType: event.event ?? "unknown", payload: event } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      response.status(204).end();
      return;
    }
    throw error;
  }
  const link = event.payload?.payment_link?.entity;
  if (link?.id && event.event === "payment_link.paid") {
    await prisma.platformInvoice.updateMany({
      where: { razorpayPaymentLinkId: link.id },
      data: { status: "PAID", amountPaid: (link.amount_paid ?? 0) / 100, paidAt: new Date(), razorpayPaymentId: link.payment_id ?? null },
    });
  }
  await prisma.razorpayWebhookEvent.update({ where: { eventId }, data: { processedAt: new Date() } });
  response.status(204).end();
}

function createRazorpayEventId(body: Buffer) {
  return `body-${createHash("sha256").update(body).digest("hex")}`;
}
