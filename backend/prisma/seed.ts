import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.PLATFORM_ADMIN_PASSWORD;

if (!connectionString) throw new Error("DATABASE_URL is required.");
if (!email || !password) throw new Error("PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD are required to create the first platform admin.");
if (password.length < 8) throw new Error("PLATFORM_ADMIN_PASSWORD must be at least 8 characters.");

const platformEmail = email!;
const platformPassword = password!;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const featureDefinitions = [
    ["DASHBOARD", "Dashboard"], ["CUSTOMERS", "Customers"], ["EMPLOYEES", "Employees"], ["SERVICES", "Services"],
    ["APPOINTMENTS", "Appointments"], ["INVENTORY", "Inventory"], ["INVOICES", "Invoices"], ["PAYROLL", "Payroll"],
    ["LOYALTY", "Loyalty"], ["ONLINE_BOOKING", "Online Booking"], ["TEMPLATE_WEBSITE", "Template Website"],
    ["CUSTOM_WEBSITE", "Custom Website"], ["PUBLIC_API", "Public API"], ["WEBSITE_MANAGEMENT", "Website Management"],
    ["MULTI_BRANCH", "Multi Branch"], ["WHATSAPP", "WhatsApp"], ["ADVANCED_REPORTS", "Advanced Reports"],
    ["CUSTOM_ERP", "Custom ERP"], ["FRANCHISE_MANAGEMENT", "Franchise Management"], ["API_INTEGRATIONS", "API Integrations"],
  ] as const;
  const allFeatures = new Map<string, string>();
  for (const [code, name] of featureDefinitions) {
    const feature = await prisma.feature.upsert({ where: { code }, update: { name }, create: { code, name } });
    allFeatures.set(code, feature.id);
  }
  const plans = [
    { code: "STARTER", name: "Starter", monthlyPrice: 999, features: ["DASHBOARD", "CUSTOMERS", "EMPLOYEES", "SERVICES", "APPOINTMENTS", "INVENTORY", "INVOICES", "PAYROLL", "LOYALTY"] },
    { code: "BUSINESS", name: "Business", monthlyPrice: 1999, features: ["DASHBOARD", "CUSTOMERS", "EMPLOYEES", "SERVICES", "APPOINTMENTS", "INVENTORY", "INVOICES", "PAYROLL", "LOYALTY", "ONLINE_BOOKING", "TEMPLATE_WEBSITE", "WEBSITE_MANAGEMENT", "WHATSAPP"] },
    { code: "PROFESSIONAL", name: "Professional", monthlyPrice: 3999, features: ["DASHBOARD", "CUSTOMERS", "EMPLOYEES", "SERVICES", "APPOINTMENTS", "INVENTORY", "INVOICES", "PAYROLL", "LOYALTY", "ONLINE_BOOKING", "CUSTOM_WEBSITE", "PUBLIC_API", "WEBSITE_MANAGEMENT", "MULTI_BRANCH", "WHATSAPP", "ADVANCED_REPORTS", "API_INTEGRATIONS"] },
    { code: "ENTERPRISE", name: "Enterprise", monthlyPrice: null, features: featureDefinitions.map(([code]) => code) },
  ];
  for (const definition of plans) {
    const plan = await prisma.plan.upsert({ where: { code: definition.code }, update: { name: definition.name, monthlyPrice: definition.monthlyPrice }, create: { code: definition.code, name: definition.name, monthlyPrice: definition.monthlyPrice } });
    // Seed defaults without overwriting feature choices made by a platform admin.
    await prisma.planFeature.createMany({ data: definition.features.map((code) => ({ planId: plan.id, featureId: allFeatures.get(code)! })), skipDuplicates: true });
  }
  const existingSalons = await prisma.salon.findMany({ where: { planId: null }, select: { id: true, subscriptionPlan: true, status: true, trialEndsAt: true } });
  for (const salon of existingSalons) {
    const plan = await prisma.plan.findFirst({ where: { name: { equals: salon.subscriptionPlan, mode: "insensitive" } } }) ?? await prisma.plan.findUniqueOrThrow({ where: { code: "STARTER" } });
    await prisma.salon.update({ where: { id: salon.id }, data: { planId: plan.id, subscriptionPlan: plan.name } });
    const existingSubscription = await prisma.subscription.findFirst({ where: { salonId: salon.id } });
    if (!existingSubscription) await prisma.subscription.create({ data: { salonId: salon.id, planId: plan.id, status: salon.status === "TRIAL" ? "TRIAL" : "ACTIVE", expiresAt: salon.trialEndsAt } });
  }
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
