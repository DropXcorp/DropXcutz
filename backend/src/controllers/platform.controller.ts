import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import {
  salonCreateInput,
  salonPatchInput,
} from "../validators/salon.validator";
import { created, ok } from "./http.controller";

export async function listSalons(_request: Request, response: Response) {
  const salons = await prisma.salon.findMany({
    include: {
      _count: {
        select: { customers: true, employees: true, appointments: true },
      },
      invoices: { where: { status: "PAID" }, select: { totalAmount: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  ok(
    response,
    salons.map(({ invoices, ...salon }) => ({
      ...salon,
      taxRate: Number(salon.taxRate),
      paidRevenue: invoices.reduce(
        (sum, invoice) => sum + Number(invoice.totalAmount),
        0,
      ),
    })),
  );
}
export async function createSalon(request: Request, response: Response) {
  const input = salonCreateInput.parse(request.body);
  const item = await prisma.$transaction(async (tx) => {
    const salon = await tx.salon.create({
      data: {
        ...input,
        gstin: input.gstin || null,
        logoUrl: input.logoUrl || null,
        website: input.website || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        postalCode: input.postalCode || null,
      },
    });
    await tx.user.create({
      data: {
        salonId: salon.id,
        name: input.adminName,
        email: input.adminEmail.toLowerCase(),
        passwordHash: await bcrypt.hash(input.adminPassword, 12),
        role: "SALON_ADMIN",
      },
    });
    return salon;
  });
  created(response, { ...item, taxRate: Number(item.taxRate) });
}
export async function updateSalon(request: Request, response: Response) {
  const id = String(request.params.id);
  const input = salonPatchInput.parse(request.body);
  const current = await prisma.salon.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Salon not found.");
  const item = await prisma.salon.update({ where: { id }, data: input });
  ok(response, { ...item, taxRate: Number(item.taxRate) });
}
export async function platformOverview(_request: Request, response: Response) {
  const [salons, users] = await Promise.all([
    prisma.salon.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.user.count(),
  ]);
  ok(response, { salons, users });
}

const audit = (
  actorId: string | undefined,
  action: string,
  entity: string,
  entityId?: string,
  details?: object,
) =>
  prisma.platformAuditLog.create({
    data: { actorId, action, entity, entityId, details },
  });
export async function listPlatformUsers(_request: Request, response: Response) {
  const users = await prisma.user.findMany({
    include: { salon: { select: { id: true, salonName: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });
  ok(
    response,
    users.map(({ passwordHash, ...user }) => user),
  );
}
export async function updatePlatformUser(request: Request, response: Response) {
  const id = String(request.params.id);
  const active = request.body?.active;
  if (typeof active !== "boolean")
    throw new ApiError(400, "active must be a boolean.");
  const user = await prisma.user.update({
    where: { id },
    data: { active },
    include: { salon: { select: { id: true, salonName: true, code: true } } },
  });
  await audit(
    response.locals.user?.id,
    active ? "USER_ENABLED" : "USER_DISABLED",
    "USER",
    id,
    { email: user.email },
  );
  const { passwordHash, ...safe } = user;
  void passwordHash;
  ok(response, safe);
}
export async function listSubscriptions(_request: Request, response: Response) {
  ok(
    response,
    await prisma.salon.findMany({
      select: {
        id: true,
        salonName: true,
        code: true,
        subscriptionPlan: true,
        status: true,
        trialEndsAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}
export async function listAuditLog(_request: Request, response: Response) {
  ok(
    response,
    await prisma.platformAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  );
}
export async function getPlatformSettings(
  _request: Request,
  response: Response,
) {
  ok(
    response,
    await prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform" },
    }),
  );
}
export async function updatePlatformSettings(
  request: Request,
  response: Response,
) {
  const input = request.body ?? {};
  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {
      ...(typeof input.platformName === "string" && {
        platformName: input.platformName.slice(0, 160),
      }),
      ...(typeof input.supportEmail === "string" && {
        supportEmail: input.supportEmail || null,
      }),
      ...(Number.isInteger(input.defaultTrialDays) && {
        defaultTrialDays: input.defaultTrialDays,
      }),
      ...(Number.isInteger(input.sessionHours) && {
        sessionHours: input.sessionHours,
      }),
      ...(Number.isInteger(input.passwordMinimumLength) && {
        passwordMinimumLength: input.passwordMinimumLength,
      }),
    },
    create: { id: "platform" },
  });
  await audit(
    response.locals.user?.id,
    "SETTINGS_UPDATED",
    "PLATFORM",
    "platform",
  );
  ok(response, settings);
}
