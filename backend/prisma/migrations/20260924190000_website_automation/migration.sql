-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('NONE', 'PENDING_DNS', 'VERIFYING', 'ACTIVE', 'FAILED');

-- CreateEnum
CREATE TYPE "AutomationJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- AlterTable: website publishing + custom-domain verification
ALTER TABLE "SalonWebsiteSettings"
  ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "templateId" VARCHAR(40),
  ADD COLUMN "domainStatus" "DomainStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "domainVerificationToken" VARCHAR(80),
  ADD COLUMN "domainVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "domainError" VARCHAR(300);

-- Sites that were already live keep working: treat existing non-NONE sites as published.
UPDATE "SalonWebsiteSettings"
   SET "isPublished" = true, "publishedAt" = COALESCE("publishedAt", "updatedAt")
 WHERE "type" <> 'NONE';

-- Custom domains must map to exactly one salon (empty strings become NULL first).
UPDATE "SalonWebsiteSettings" SET "customDomain" = NULL WHERE "customDomain" = '';
UPDATE "SalonWebsiteSettings" SET "customDomain" = lower("customDomain") WHERE "customDomain" IS NOT NULL;
CREATE UNIQUE INDEX "SalonWebsiteSettings_customDomain_key" ON "SalonWebsiteSettings"("customDomain");

-- AlterTable: booking lifecycle automation
ALTER TABLE "Appointment"
  ADD COLUMN "holdExpiresAt" TIMESTAMP(3),
  ADD COLUMN "manageToken" VARCHAR(64),
  ADD COLUMN "confirmationSentAt" TIMESTAMP(3),
  ADD COLUMN "reminder24SentAt" TIMESTAMP(3),
  ADD COLUMN "reminder2SentAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Appointment_manageToken_key" ON "Appointment"("manageToken");

-- CreateTable
CREATE TABLE "AutomationJob" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(60) NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "status" "AutomationJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "lastError" VARCHAR(500),
    "dedupeKey" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AutomationJob_dedupeKey_key" ON "AutomationJob"("dedupeKey");
CREATE INDEX "AutomationJob_status_runAt_idx" ON "AutomationJob"("status", "runAt");
