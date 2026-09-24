import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { ok, salonId } from "./http.controller";
import { encryptPaymentSecret, salonRazorpayCredentials, testRazorpayCredentials } from "../services/salon-razorpay.service";

const input = z.object({
  keyId: z.string().trim().min(8).max(80).regex(/^rzp_(test|live)_[A-Za-z0-9]+$/, "Key ID looks wrong. It should start with rzp_test_ or rzp_live_."),
  keySecret: z.string().trim().min(8).max(200),
  webhookSecret: z.string().trim().min(6).max(200),
});

const publicApiBase = (request: Request) => {
  const configured = process.env.API_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const host = request.header("x-forwarded-host") ?? request.header("host");
  const proto = request.header("x-forwarded-proto") ?? request.protocol;
  return host ? `${proto}://${host}` : "";
};

async function status(request: Request, id: string) {
  const [salon, settings, lastEvent] = await Promise.all([
    prisma.salon.findUniqueOrThrow({
      where: { id },
      select: { razorpayKeyId: true, razorpayKeySecretCipher: true, razorpayWebhookCipher: true },
    }),
    prisma.salonSettings.findUnique({ where: { salonId: id }, select: { allowOnlinePayments: true } }),
    // Webhook events carry the salonId we put in the order notes.
    prisma.razorpayWebhookEvent.findFirst({
      where: { payload: { path: ["payload", "payment", "entity", "notes", "salonId"], equals: id } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, eventType: true, processingError: true },
    }),
  ]);
  const configured = Boolean(salon.razorpayKeyId && salon.razorpayKeySecretCipher && salon.razorpayWebhookCipher);
  return {
    provider: "RAZORPAY",
    configured,
    keyId: salon.razorpayKeyId ?? "",
    mode: salon.razorpayKeyId?.startsWith("rzp_live_") ? "live" : salon.razorpayKeyId ? "test" : null,
    enabled: settings?.allowOnlinePayments ?? true,
    webhookUrl: `${publicApiBase(request)}/api/webhooks/razorpay/salon`,
    lastWebhook: lastEvent ? { at: lastEvent.createdAt, event: lastEvent.eventType, error: lastEvent.processingError } : null,
  };
}

export async function getPaymentIntegration(request: Request, response: Response) {
  ok(response, await status(request, salonId(response)));
}

export async function savePaymentIntegration(request: Request, response: Response) {
  const value = input.parse(request.body);
  await testRazorpayCredentials(value.keyId, value.keySecret);
  const id = salonId(response);
  await prisma.salon.update({
    where: { id },
    data: {
      razorpayKeyId: value.keyId,
      razorpayKeySecretCipher: encryptPaymentSecret(value.keySecret),
      razorpayWebhookCipher: encryptPaymentSecret(value.webhookSecret),
    },
  });
  await prisma.salonAuditLog.create({
    data: { salonId: id, userId: response.locals.user?.id ?? null, action: "PAYMENT_GATEWAY_CONNECTED", entity: "PaymentIntegration", entityId: id, newValue: { keyId: value.keyId } },
  });
  ok(response, await status(request, id));
}

/** Re-checks the saved keys against Razorpay (never returns the secrets). */
export async function testPaymentIntegration(request: Request, response: Response) {
  const id = salonId(response);
  const salon = await prisma.salon.findUniqueOrThrow({
    where: { id },
    select: { razorpayKeyId: true, razorpayKeySecretCipher: true, razorpayWebhookCipher: true },
  });
  if (!salon.razorpayKeyId || !salon.razorpayKeySecretCipher) throw new ApiError(409, "Connect Razorpay first.");
  const credentials = salonRazorpayCredentials(salon);
  const result = await testRazorpayCredentials(credentials.keyId, credentials.keySecret);
  ok(response, { ok: true, mode: result.mode, webhookSecretSaved: Boolean(credentials.webhookSecret) });
}

export async function updatePaymentSettings(request: Request, response: Response) {
  const { enabled } = z.object({ enabled: z.boolean() }).parse(request.body);
  const id = salonId(response);
  await prisma.salonSettings.upsert({ where: { salonId: id }, create: { salonId: id, allowOnlinePayments: enabled }, update: { allowOnlinePayments: enabled } });
  await prisma.salonAuditLog.create({
    data: { salonId: id, userId: response.locals.user?.id ?? null, action: enabled ? "ONLINE_PAYMENTS_ENABLED" : "ONLINE_PAYMENTS_DISABLED", entity: "PaymentIntegration", entityId: id },
  });
  ok(response, await status(request, id));
}

export async function disconnectPaymentIntegration(request: Request, response: Response) {
  const id = salonId(response);
  await prisma.salon.update({ where: { id }, data: { razorpayKeyId: null, razorpayKeySecretCipher: null, razorpayWebhookCipher: null } });
  await prisma.salonAuditLog.create({
    data: { salonId: id, userId: response.locals.user?.id ?? null, action: "PAYMENT_GATEWAY_DISCONNECTED", entity: "PaymentIntegration", entityId: id },
  });
  ok(response, await status(request, id));
}
