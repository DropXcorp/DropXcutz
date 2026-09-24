import type { Request, Response } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
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
import { markPaymentPaid, notifyPaymentIssue } from "../services/booking-payment.service";

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
  const token = request.header("x-booking-token") ?? "";
  if (!appointment.manageToken || token.length !== appointment.manageToken.length || !timingSafeEqual(Buffer.from(token), Buffer.from(appointment.manageToken)))
    throw new ApiError(403, "This booking link is invalid or has expired.");
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
      status: saved.payment.status,
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
  const parsed = JSON.parse(rawBody.toString("utf8"));
  const event = parsed as {
    event?: string;
    payload?: {
      payment?: { entity?: { order_id?: string; id?: string; error_description?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  const orderId = event.payload?.payment?.entity?.order_id ?? event.payload?.order?.entity?.id;
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

  const eventId = "salon:" + (request.header("x-razorpay-event-id") ?? createHash("sha256").update(rawBody).digest("hex"));
  try {
    await prisma.razorpayWebhookEvent.create({
      data: { eventId, eventType: event.event ?? "unknown", payload: parsed },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      response.status(204).end();
      return;
    }
    throw error;
  }

  try {
    const razorpayPaymentId = event.payload?.payment?.entity?.id;
    if ((event.event === "payment.captured" || event.event === "order.paid") && razorpayPaymentId) {
      await markPaymentPaid(payment.id, razorpayPaymentId);
    } else if (event.event === "payment.failed") {
      await notifyPaymentIssue(
        payment.appointment.salonId,
        "Online payment failed",
        "Payment for " + payment.appointment.appointmentNumber + " failed: " + (event.payload?.payment?.entity?.error_description ?? "the customer's bank declined it") + ". The customer can retry from their booking link.",
      );
    }
    await prisma.razorpayWebhookEvent.update({ where: { eventId }, data: { processedAt: new Date() } });
  } catch (error) {
    await prisma.razorpayWebhookEvent
      .update({ where: { eventId }, data: { processingError: String(error).slice(0, 500) } })
      .catch(() => undefined);
    throw error;
  }
  response.status(204).end();
}
