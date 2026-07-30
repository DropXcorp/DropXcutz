import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.PLATFORM_ADMIN_PASSWORD;

if (!connectionString) throw new Error("DATABASE_URL is required.");
if (!email || !password) throw new Error("PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD are required to create the first platform admin.");
if (password.length < 8) throw new Error("PLATFORM_ADMIN_PASSWORD must be at least 12 characters.");

const platformEmail = email!;
const platformPassword = password!;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  await prisma.user.upsert({
    where: { email: platformEmail },
    update: { name: process.env.PLATFORM_ADMIN_NAME?.trim() || "Platform Administrator", role: "PLATFORM_ADMIN", salonId: null, active: true },
    create: {
      name: process.env.PLATFORM_ADMIN_NAME?.trim() || "Platform Administrator",
      email: platformEmail,
      passwordHash: await bcrypt.hash(platformPassword, 12),
      role: "PLATFORM_ADMIN",
      salonId: null,
    },
  });
  console.info(`Platform administrator is ready: ${email}`);
}

main().finally(() => prisma.$disconnect());