import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { ApiError } from "../middleware/error.middleware";

type SalonCredentials = {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
};

const encryptionKey = () => {
  const value = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY?.trim();
  const key = value ? Buffer.from(value, "base64") : null;
  if (!key || key.length !== 32)
    throw new ApiError(503, "Salon payment encryption is not configured.");
  return key;
};

export function encryptPaymentSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptPaymentSecret(value: string) {
  const [iv, tag, encrypted] = value.split(".");
  if (!iv || !tag || !encrypted)
    throw new ApiError(500, "Stored salon payment credentials are invalid.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function salonRazorpayCredentials(salon: {
  razorpayKeyId: string | null;
  razorpayKeySecretCipher: string | null;
  razorpayWebhookCipher?: string | null;
}): SalonCredentials {
  if (!salon.razorpayKeyId || !salon.razorpayKeySecretCipher)
    throw new ApiError(
      503,
      "Online payments are not configured for this salon.",
    );
  return {
    keyId: salon.razorpayKeyId,
    keySecret: decryptPaymentSecret(salon.razorpayKeySecretCipher),
    webhookSecret: salon.razorpayWebhookCipher
      ? decryptPaymentSecret(salon.razorpayWebhookCipher)
      : undefined,
  };
}

export async function createSalonRazorpayOrder(input: {
  credentials: SalonCredentials;
  amountPaise: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}) {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${input.credentials.keyId}:${input.credentials.keySecret}`).toString("base64")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    amount?: number;
    currency?: string;
    error?: { description?: string };
  };
  if (!response.ok || !payload.id)
    throw new ApiError(
      502,
      payload.error?.description ??
        "Razorpay could not create a payment order.",
    );
  return {
    id: payload.id,
    amount: payload.amount ?? input.amountPaise,
    currency: payload.currency ?? input.currency,
  };
}

export function verifySalonCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}) {
  const expected = createHmac("sha256", input.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return (
    expected.length === input.signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature))
  );
}

export function verifySalonWebhook(
  rawBody: Buffer,
  signature: string | undefined,
  webhookSecret: string | undefined,
) {
  if (!signature || !webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return (
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}
