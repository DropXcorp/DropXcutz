import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "../middleware/error.middleware";

type RazorpayPaymentLink = { id: string; short_url: string; status: string };

const credentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new ApiError(503, "Razorpay billing is not configured.");
  }
  return { keyId, keySecret };
};

export async function createRazorpayPaymentLink(input: {
  referenceId: string;
  amountPaise: number;
  currency: string;
  description: string;
  customer: { name: string; email?: string | null; contact?: string | null };
  expiresAt?: Date | null;
}) {
  const { keyId, keySecret } = credentials();
  const response = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency,
      reference_id: input.referenceId,
      description: input.description,
      customer: input.customer,
      expire_by: input.expiresAt
        ? Math.floor(input.expiresAt.getTime() / 1000)
        : undefined,
      // Do not deliver through email/SMS/WhatsApp; the platform operator shares the URL.
      notify: { sms: false, email: false },
      reminder_enable: false,
    }),
  });
  const payload = (await response
    .json()
    .catch(() => ({}))) as RazorpayPaymentLink & {
    error?: { description?: string };
  };
  if (!response.ok || !payload.id || !payload.short_url) {
    throw new ApiError(
      502,
      payload.error?.description ?? "Razorpay could not create a payment link.",
    );
  }
  return payload;
}

export function verifyRazorpayWebhook(
  rawBody: Buffer,
  signature: string | undefined,
) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return (
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}
