-- Allow a platform administrator without a salon assignment.
ALTER TABLE "User" ALTER COLUMN "salonId" DROP NOT NULL;

-- This command is idempotent for databases where the enum value was added manually.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';