-- Public website booking support. Existing salons use their unique code as the initial slug.
ALTER TABLE "Salon" ADD COLUMN "slug" VARCHAR(60);
UPDATE "Salon" SET "slug" = "code" WHERE "slug" IS NULL;
ALTER TABLE "Salon" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Salon_slug_key" ON "Salon"("slug");

ALTER TABLE "Service" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Employee" ADD COLUMN "isBookable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Appointment" ADD COLUMN "websiteRequestId" VARCHAR(100);
CREATE UNIQUE INDEX "Appointment_salonId_websiteRequestId_key" ON "Appointment"("salonId", "websiteRequestId");

ALTER TYPE "AppointmentSource" RENAME VALUE 'ONLINE' TO 'WEBSITE';

CREATE TABLE "SalonIntegration" (
  "id" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "publicKey" VARCHAR(100) NOT NULL,
  "allowedDomains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalonIntegration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SalonIntegration_publicKey_key" ON "SalonIntegration"("publicKey");
CREATE INDEX "SalonIntegration_salonId_idx" ON "SalonIntegration"("salonId");
ALTER TABLE "SalonIntegration" ADD CONSTRAINT "SalonIntegration_salonId_fkey"
  FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
