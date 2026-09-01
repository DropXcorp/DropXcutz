import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ok, salonId } from "./http.controller";
import { encryptPaymentSecret } from "../services/salon-razorpay.service";

const input = z.object({
  keyId: z.string().trim().min(1).max(80),
  keySecret: z.string().trim().min(1).max(200),
  webhookSecret: z.string().trim().min(1).max(200),
});

export async function getPaymentIntegration(
  _request: Request,
  response: Response,
) {
  const salon = await prisma.salon.findUniqueOrThrow({
    where: { id: salonId(response) },
    select: {
      razorpayKeyId: true,
      razorpayKeySecretCipher: true,
      razorpayWebhookCipher: true,
    },
  });
  ok(response, {
    provider: "RAZORPAY",
    configured: Boolean(
      salon.razorpayKeyId &&
      salon.razorpayKeySecretCipher &&
      salon.razorpayWebhookCipher,
    ),
    keyId: salon.razorpayKeyId ?? "",
  });
}

export async function savePaymentIntegration(
  request: Request,
  response: Response,
) {
  const value = input.parse(request.body);
  await prisma.salon.update({
    where: { id: salonId(response) },
    data: {
      razorpayKeyId: value.keyId,
      razorpayKeySecretCipher: encryptPaymentSecret(value.keySecret),
      razorpayWebhookCipher: encryptPaymentSecret(value.webhookSecret),
    },
  });
  ok(response, { provider: "RAZORPAY", configured: true, keyId: value.keyId });
}
