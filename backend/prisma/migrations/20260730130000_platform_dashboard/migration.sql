CREATE TABLE "PlatformAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" VARCHAR(100) NOT NULL,
  "entity" VARCHAR(80) NOT NULL,
  "entityId" VARCHAR(100),
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlatformAuditLog_createdAt_idx" ON "PlatformAuditLog"("createdAt");
CREATE INDEX "PlatformAuditLog_entity_entityId_idx" ON "PlatformAuditLog"("entity", "entityId");
CREATE TABLE "PlatformSettings" (
  "id" TEXT NOT NULL DEFAULT 'platform',
  "platformName" VARCHAR(160) NOT NULL DEFAULT 'DropXCutz Platform',
  "supportEmail" VARCHAR(200),
  "defaultTrialDays" INTEGER NOT NULL DEFAULT 14,
  "sessionHours" INTEGER NOT NULL DEFAULT 8,
  "passwordMinimumLength" INTEGER NOT NULL DEFAULT 12,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "PlatformSettings" ("id", "updatedAt") VALUES ('platform', CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING;