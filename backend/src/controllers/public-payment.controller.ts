import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import {
  createSalonRazorpayOrder,
  salonRazorpayCredentials,
  verifySalonCheckoutSignature,
  verifySalonWebhook,
} from "../services/salon-razorpay.service";
import { salonForPublic } from "./public-booking.controller";

const verifyInput = z.object({
  orderId: z.string().trim().min(1).max(80),
  paymentId: z.string().trim().min(1).max(80),
  signature: z.string().trim().min(1).max(200),
});

export async function createPublicPaymentOrder(
  request: Request,
  response: Response,
) {
  const salon = await salonForPublic(response);
  if (!salon.allowOnlinePayments)
    throw new ApiError(403, "Online payments are unavailable for this salon.");
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: String(request.params.id),
      salonId: salon.id,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    include: { customer: true },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found.");
  if (appointment.paymentStatus === "PAID")
    throw new ApiError(409, "This appointment is already paid.");
  const existing = await prisma.payment.findFirst({
    where: {
      appointmentId: appointment.id,
      method: "ONLINE",
      status: "PENDING",
      razorpayOrderId: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });
  const credentials = salonRazorpayCredentials(salon);
  if (existing?.razorpayOrderId) {
    response.json({
      data: {
        orderId: existing.razorpayOrderId,
        keyId: credentials.keyId,
        amount: Math.round(Number(existing.amount) * 100),
        currency: salon.currency,
        appointmentNumber: appointment.appointmentNumber,
      },
    });
    return;
  }
  const amount = Math.max(
    Number(appointment.totalAmount) - Number(appointment.amountPaid),
    0,
  );
  if (!amount)
    throw new ApiError(409, "There is no remaining balance to collect.");
  const order = await createSalonRazorpayOrder({
    credentials,
    amountPaise: Math.round(amount * 100),
    currency: salon.currency,
    receipt: appointment.appointmentNumber,
    notes: {
      salonId: salon.id,
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
    },
  });
  await prisma.payment.create({
    data: {
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      amount,
      method: "ONLINE",
      status: "PENDING",
      razorpayOrderId: order.id,
    },
  });
  response
    .status(201)
    .json({
      data: {
        orderId: order.id,
        keyId: credentials.keyId,
        amount: order.amount,
        currency: order.currency,
        appointmentNumber: appointment.appointmentNumber,
        customer: {
          name: appointment.customer.name,
          email: appointment.customer.email,
          contact: appointment.customer.phone,
        },
      },
    });
}

export async function verifyPublicPayment(
  request: Request,
  response: Response,
) {
  const salon = await salonForPublic(response);
  const value = verifyInput.parse(request.body);
  const payment = await prisma.payment.findFirst({
    where: {
      razorpayOrderId: value.orderId,
      appointment: { salonId: salon.id },
    },
    include: { appointment: true },
  });
  if (!payment) throw new ApiError(404, "Payment order not found.");
  if (!payment.appointment)
    throw new ApiError(409, "This payment is not linked to an appointment.");
  const credentials = salonRazorpayCredentials(salon);
  if (
    !verifySalonCheckoutSignature({
      orderId: value.orderId,
      paymentId: value.paymentId,
      signature: value.signature,
      keySecret: credentials.keySecret,
    })
  )
    throw new ApiError(400, "Invalid payment signature.");
  const saved = await markPaymentPaid(payment.id, value.paymentId);
  response.json({
    data: {
      status: saved.status,
      appointmentNumber: payment.appointment.appointmentNumber,
    },
  });
}

export async function handleSalonRazorpayWebhook(
  request: Request,
  response: Response,
) {
  const rawBody = request.body as Buffer;
  if (!Buffer.isBuffer(rawBody))
    throw new ApiError(400, "Invalid webhook body.");
  const event = JSON.parse(rawBody.toString("utf8")) as {
    event?: string;
    payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
  };
  const orderId = event.payload?.payment?.entity?.order_id;
  if (!orderId) {
    response.status(204).end();
    return;
  }
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
    include: { appointment: { include: { salon: true } } },
  });
  if (!payment) {
    response.status(204).end();
    return;
  }
  if (!payment.appointment)
    throw new ApiError(409, "This payment is not linked to an appointment.");
  const credentials = salonRazorpayCredentials(payment.appointment.salon);
  if (
    !verifySalonWebhook(
      rawBody,
      request.header("x-razorpay-signature") ?? undefined,
      credentials.webhookSecret,
    )
  )
    throw new ApiError(401, "Invalid Razorpay webhook signature.");
  if (event.event === "payment.captured" && event.payload?.payment?.entity?.id)
    await markPaymentPaid(payment.id, event.payload.payment.entity.id);
  response.status(204).end();
}

async function markPaymentPaid(paymentId: string, razorpayPaymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });
    if (payment.status === "PAID") return payment;
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", razorpayPaymentId, paidAt: new Date() },
    });
    if (payment.appointmentId) {
      const appointment = await tx.appointment.findUniqueOrThrow({
        where: { id: payment.appointmentId },
      });
      const amountPaid =
        Number(appointment.amountPaid) + Number(payment.amount);
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          amountPaid,
          paymentStatus:
            amountPaid >= Number(appointment.totalAmount)
              ? "PAID"
              : "PARTIALLY_PAID",
        },
      });
    }
    return updated;
  });
}
