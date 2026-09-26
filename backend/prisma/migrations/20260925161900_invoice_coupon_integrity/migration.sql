-- Unlink duplicate invoices from the same appointment before enforcing uniqueness,
-- keeping the most recently issued invoice as the one linked to the appointment.
-- (These duplicates could only exist because of the double-invoice bug this migration fixes;
-- unlinking preserves the invoice records instead of deleting billing history.)
WITH ranked AS (
  SELECT "id",
         ROW_NUMBER() OVER (
           PARTITION BY "salonId", "appointmentId"
           ORDER BY "issuedAt" DESC, "id" DESC
         ) AS rn
  FROM "Invoice"
  WHERE "appointmentId" IS NOT NULL
)
UPDATE "Invoice"
   SET "appointmentId" = NULL
  FROM ranked
 WHERE "Invoice"."id" = ranked."id"
   AND ranked.rn > 1;

-- AlterTable
CREATE UNIQUE INDEX "Invoice_salonId_appointmentId_key" ON "Invoice"("salonId", "appointmentId");

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0;
