ALTER TYPE "AppointmentSource" ADD VALUE IF NOT EXISTS 'ERP';
ALTER TYPE "AppointmentSource" ADD VALUE IF NOT EXISTS 'WHATSAPP';

CREATE TYPE "WebsiteType" AS ENUM ('NONE', 'TEMPLATE', 'CUSTOM');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

CREATE TABLE "Plan" (
  "id" TEXT NOT NULL, "code" VARCHAR(60) NOT NULL, "name" VARCHAR(100) NOT NULL,
  "description" TEXT, "monthlyPrice" DECIMAL(12,2), "annualPrice" DECIMAL(12,2),
  "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

CREATE TABLE "Feature" (
  "id" TEXT NOT NULL, "code" VARCHAR(80) NOT NULL, "name" VARCHAR(120) NOT NULL,
  "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Feature_code_key" ON "Feature"("code");

CREATE TABLE "PlanFeature" (
  "planId" TEXT NOT NULL, "featureId" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("planId", "featureId")
);
CREATE INDEX "PlanFeature_featureId_idx" ON "PlanFeature"("featureId");

CREATE TABLE "SalonFeature" (
  "salonId" TEXT NOT NULL, "featureId" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalonFeature_pkey" PRIMARY KEY ("salonId", "featureId")
);
CREATE INDEX "SalonFeature_featureId_idx" ON "SalonFeature"("featureId");

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL, "salonId" TEXT NOT NULL, "planId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL', "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3), "monthlyPrice" DECIMAL(12,2), "annualPrice" DECIMAL(12,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Subscription_salonId_status_idx" ON "Subscription"("salonId", "status");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

CREATE TABLE "SalonWebsiteSettings" (
  "id" TEXT NOT NULL, "salonId" TEXT NOT NULL, "type" "WebsiteType" NOT NULL DEFAULT 'NONE',
  "title" VARCHAR(160), "description" TEXT, "customDomain" VARCHAR(253), "theme" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalonWebsiteSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SalonWebsiteSettings_salonId_key" ON "SalonWebsiteSettings"("salonId");

ALTER TABLE "Salon" ADD COLUMN "planId" TEXT;
CREATE INDEX "Salon_planId_idx" ON "Salon"("planId");
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalonFeature" ADD CONSTRAINT "SalonFeature_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalonFeature" ADD CONSTRAINT "SalonFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalonWebsiteSettings" ADD CONSTRAINT "SalonWebsiteSettings_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
