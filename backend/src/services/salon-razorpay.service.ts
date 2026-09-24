import {
  createCipheriv,
  createDecipheriv,
  createHash,
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

function loadKey(name: string) {
  const value = process.env[name]?.trim();
  const key = value ? Buffer.from(value, "base64") : null;
  return key && key.length === 32 ? key : null;
}
const keyId = (key: Buffer) => createHash("sha256").update(key).digest("hex").slice(0, 8);
const encryptionKey = () => {
  const key = loadKey("PAYMENT_CREDENTIALS_ENCRYPTION_KEY");
  if (!key) throw new ApiError(503, "Salon payment encryption is not configured (PAYMENT_CREDENTIALS_ENCRYPTION_KEY must be a base64 32-byte key).");
  return key;
};

/** Output format: k<keyId>:iv.tag.cipher — the key id lets you rotate keys (keep the old one in PAYMENT_CREDENTIALS_ENCRYPTION_KEY_PREVIOUS). */
export function encryptPaymentSecret(value: string) {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return (
    "k" + keyId(key) + ":" +
    [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".")
  );
}

export function decryptPaymentSecret(value: string) {
  const match = value.match(/^k([0-9a-f]{8}):(.+)$/);
  const [iv, tag, encrypted] = (match?.[2] ?? value).split(".");
  if (!iv || !tag || !encrypted)
    throw new ApiError(500, "Stored salon payment credentials are invalid.");
  const candidates = [loadKey("PAYMENT_CREDENTIALS_ENCRYPTION_KEY"), loadKey("PAYMENT_CREDENTIALS_ENCRYPTION_KEY_PREVIOUS")]
    .flatMap((key) => (key ? [key] : []))
    .filter((key) => !match || keyId(key) === match[1]);
  if (candidates.length === 0) throw new ApiError(503, "Salon payment encryption is not configured for the stored credentials.");
  for (const key of candidates) {
    try {
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
      decipher.setAuthTag(Buffer.from(tag, "base64"));
      return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]).toString("utf8");
    } catch {
      // try the next key
    }
  }
  throw new ApiError(503, "Saved payment credentials can no longer be decrypted. The salon must re-enter its Razorpay keys.");
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

/** Verifies a key pair by making a harmless read-only call to Razorpay. */
export async function testRazorpayCredentials(keyId: string, keySecret: string) {
  const response = await fetch("https://api.razorpay.com/v1/payments?count=1", {
    headers: { authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!response) throw new ApiError(502, "Could not reach Razorpay to verify the keys. Please try again.");
  if (response.status === 401) throw new ApiError(400, "Razorpay rejected these keys. Check the Key ID and Key Secret (test keys start with rzp_test_, live keys with rzp_live_).");
  if (!response.ok) throw new ApiError(502, "Razorpay could not verify the keys right now. Please try again.");
  return { mode: keyId.startsWith("rzp_live_") ? ("live" as const) : ("test" as const) };
}
