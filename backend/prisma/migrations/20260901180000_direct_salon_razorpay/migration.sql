ALTER TABLE "Salon"
  ADD COLUMN "razorpayKeyId" VARCHAR(80),
  ADD COLUMN "razorpayKeySecretCipher" TEXT,
  ADD COLUMN "razorpayWebhookCipher" TEXT;

ALTER TABLE "Payment"
  ADD COLUMN "razorpayOrderId" VARCHAR(80),
  ADD COLUMN "razorpayPaymentId" VARCHAR(80),
  ADD COLUMN "razorpayRefundId" VARCHAR(80);

CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");
CREATE UNIQUE INDEX "Payment_razorpayRefundId_key" ON "Payment"("razorpayRefundId");
