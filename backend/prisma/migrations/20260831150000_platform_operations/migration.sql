CREATE TYPE "PlatformInvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'OVERDUE', 'VOID', 'REFUNDED');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_SALON', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "BulkOperationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED');

ALTER TABLE "Salon" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "razorpayPlanId" VARCHAR(80), ADD COLUMN "razorpaySubscriptionId" VARCHAR(80), ADD COLUMN "billingCycle" VARCHAR(20);
ALTER TABLE "User" ADD COLUMN "platformRoleId" TEXT, ADD COLUMN "twoFactorSecret" TEXT, ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Session" ADD COLUMN "ipAddress" VARCHAR(64), ADD COLUMN "userAgent" VARCHAR(500);

CREATE UNIQUE INDEX "Subscription_razorpayPlanId_key" ON "Subscription"("razorpayPlanId");
CREATE UNIQUE INDEX "Subscription_razorpaySubscriptionId_key" ON "Subscription"("razorpaySubscriptionId");
CREATE INDEX "User_platformRoleId_idx" ON "User"("platformRoleId");

CREATE TABLE "PlatformRole" (
  "id" TEXT NOT NULL,
  "code" VARCHAR(60) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformRole_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlatformRole_code_key" ON "PlatformRole"("code");
CREATE UNIQUE INDEX "PlatformRole_name_key" ON "PlatformRole"("name");

CREATE TABLE "PlatformRolePermission" (
  "roleId" TEXT NOT NULL,
  "permission" VARCHAR(100) NOT NULL,
  CONSTRAINT "PlatformRolePermission_pkey" PRIMARY KEY ("roleId", "permission")
);

CREATE TABLE "PlatformInvoice" (
  "id" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "invoiceNumber" VARCHAR(40) NOT NULL,
  "status" "PlatformInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotal" DECIMAL(12,2) NOT NULL,
  "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "dueAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "razorpayPaymentLinkId" VARCHAR(80),
  "razorpayPaymentId" VARCHAR(80),
  "paymentUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformInvoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlatformInvoice_invoiceNumber_key" ON "PlatformInvoice"("invoiceNumber");
CREATE UNIQUE INDEX "PlatformInvoice_razorpayPaymentLinkId_key" ON "PlatformInvoice"("razorpayPaymentLinkId");
CREATE UNIQUE INDEX "PlatformInvoice_razorpayPaymentId_key" ON "PlatformInvoice"("razorpayPaymentId");
CREATE INDEX "PlatformInvoice_salonId_status_dueAt_idx" ON "PlatformInvoice"("salonId", "status", "dueAt");
CREATE INDEX "PlatformInvoice_subscriptionId_idx" ON "PlatformInvoice"("subscriptionId");

CREATE TABLE "RazorpayWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventId" VARCHAR(100) NOT NULL,
  "eventType" VARCHAR(100) NOT NULL,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3),
  "processingError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RazorpayWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RazorpayWebhookEvent_eventId_key" ON "RazorpayWebhookEvent"("eventId");
CREATE INDEX "RazorpayWebhookEvent_eventType_createdAt_idx" ON "RazorpayWebhookEvent"("eventType", "createdAt");

CREATE TABLE "LoginHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ipAddress" VARCHAR(64),
  "userAgent" VARCHAR(500),
  "succeeded" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LoginHistory_userId_createdAt_idx" ON "LoginHistory"("userId", "createdAt");

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "salonId" TEXT,
  "reporterId" TEXT,
  "assigneeId" TEXT,
  "subject" VARCHAR(200) NOT NULL,
  "description" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportTicket_status_priority_updatedAt_idx" ON "SupportTicket"("status", "priority", "updatedAt");
CREATE INDEX "SupportTicket_salonId_status_idx" ON "SupportTicket"("salonId", "status");
CREATE INDEX "SupportTicket_assigneeId_status_idx" ON "SupportTicket"("assigneeId", "status");

CREATE TABLE "SupportTicketComment" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorId" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicketComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportTicketComment_ticketId_createdAt_idx" ON "SupportTicketComment"("ticketId", "createdAt");

CREATE TABLE "TrialReminder" (
  "id" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "trialEndsAt" TIMESTAMP(3) NOT NULL,
  "reminderDay" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrialReminder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TrialReminder_salonId_trialEndsAt_reminderDay_key" ON "TrialReminder"("salonId", "trialEndsAt", "reminderDay");
CREATE INDEX "TrialReminder_createdAt_idx" ON "TrialReminder"("createdAt");

CREATE TABLE "PlatformBulkOperation" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "status" "BulkOperationStatus" NOT NULL DEFAULT 'PENDING',
  "input" JSONB NOT NULL,
  "result" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "PlatformBulkOperation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlatformBulkOperation_actorId_createdAt_idx" ON "PlatformBulkOperation"("actorId", "createdAt");
CREATE INDEX "PlatformBulkOperation_status_createdAt_idx" ON "PlatformBulkOperation"("status", "createdAt");

CREATE TABLE "PlatformBulkOperationItem" (
  "id" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "salonId" TEXT NOT NULL,
  "status" "BulkOperationStatus" NOT NULL DEFAULT 'PENDING',
  "error" TEXT,
  CONSTRAINT "PlatformBulkOperationItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlatformBulkOperationItem_operationId_salonId_key" ON "PlatformBulkOperationItem"("operationId", "salonId");
CREATE INDEX "PlatformBulkOperationItem_salonId_idx" ON "PlatformBulkOperationItem"("salonId");

ALTER TABLE "User" ADD CONSTRAINT "User_platformRoleId_fkey" FOREIGN KEY ("platformRoleId") REFERENCES "PlatformRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlatformRolePermission" ADD CONSTRAINT "PlatformRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "PlatformRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformInvoice" ADD CONSTRAINT "PlatformInvoice_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformInvoice" ADD CONSTRAINT "PlatformInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicketComment" ADD CONSTRAINT "SupportTicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicketComment" ADD CONSTRAINT "SupportTicketComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrialReminder" ADD CONSTRAINT "TrialReminder_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformBulkOperation" ADD CONSTRAINT "PlatformBulkOperation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformBulkOperationItem" ADD CONSTRAINT "PlatformBulkOperationItem_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "PlatformBulkOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
