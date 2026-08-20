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

export async function getSalon(request: Request, response: Response) {
  const id = String(request.params.id);
  const salon = await prisma.salon.findUnique({
    where: { id },
    include: {
      _count: {
        select: { customers: true, employees: true, appointments: true, branches: true, services: true },
      },
      invoices: { where: { status: "PAID" }, select: { totalAmount: true } },
      users: { select: { id: true, name: true, email: true, role: true, active: true } },
    },
  });
  if (!salon) throw new ApiError(404, "Salon not found.");
  const { invoices, ...data } = salon;
  ok(response, {
    ...data,
    taxRate: Number(salon.taxRate),
    paidRevenue: invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0),
  });
}

export async function createSalon(request: Request, response: Response) {
  const input = salonCreateInput.parse(request.body);
  const normalizedEmail = input.email.toLowerCase();
  const normalizedAdminEmail = input.adminEmail.toLowerCase();
  const { adminPassword, ...salonInput } = input;
  const item = await prisma.$transaction(async (tx) => {
    const salon = await tx.salon.create({
      data: {
        ...salonInput,
        email: normalizedEmail,
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
        email: normalizedAdminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        mustChangePassword: true,
        role: "SALON_ADMIN",
      },
    });
    return salon;
  });
  await audit(
    response.locals.user?.id,
    "SALON_CREATED",
    "SALON",
    item.id,
    { salonName: item.salonName, code: item.code },
  );
  created(response, { ...item, taxRate: Number(item.taxRate) });
}

export async function sendNotification(request: Request, response: Response) {
  const target = String(request.body?.salonId ?? "").trim();
  const title = String(request.body?.title ?? "").trim();
  const message = String(request.body?.message ?? "").trim();
  if (!target || !title || !message) {
    throw new ApiError(400, "Salon, title and message are required.");
  }
  if (title.length > 160)
    throw new ApiError(400, "Title must be 160 characters or fewer.");
  if (message.length > 5000)
    throw new ApiError(400, "Message must be 5000 characters or fewer.");
  const salons =
    target === "all"
      ? await prisma.salon.findMany({
          where: { status: { not: "ARCHIVED" } },
          select: { id: true },
        })
      : await prisma.salon.findMany({
          where: { id: target },
          select: { id: true },
        });
  if (!salons.length) throw new ApiError(404, "Salon not found.");
  await prisma.notification.createMany({
    data: salons.map((salon) => ({
      salonId: salon.id,
      type: "SYSTEM" as const,
      title,
      message,
    })),
  });
  await audit(
    response.locals.user?.id,
    "NOTIFICATION_SENT",
    "NOTIFICATION",
    undefined,
    { target, title, recipientCount: salons.length },
  );
  ok(response, { count: salons.length });
}

export async function updateSalon(request: Request, response: Response) {
  const id = String(request.params.id);
  const input = salonPatchInput.parse(request.body);
  const current = await prisma.salon.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Salon not found.");
  const item = await prisma.salon.update({ where: { id }, data: input });
  await audit(
    response.locals.user?.id,
    "SALON_UPDATED",
    "SALON",
    id,
    { salonName: item.salonName, changes: input },
  );
  ok(response, { ...item, taxRate: Number(item.taxRate) });
}

export async function deleteSalon(request: Request, response: Response) {
  const id = String(request.params.id);
  const current = await prisma.salon.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Salon not found.");
  await prisma.salon.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  await audit(
    response.locals.user?.id,
    "SALON_ARCHIVED",
    "SALON",
    id,
    { salonName: current.salonName },
  );
  response.status(204).end();
}

export async function platformOverview(_request: Request, response: Response) {
  const [
    totalSalons,
    activeSalons,
    trialSalons,
    suspendedSalons,
    totalUsers,
    totalCustomers,
    totalAppointments,
    invoicesAggregate,
    recentSalons,
    recentAudit,
  ] = await Promise.all([
    prisma.salon.count(),
    prisma.salon.count({ where: { status: "ACTIVE" } }),
    prisma.salon.count({ where: { status: "TRIAL" } }),
    prisma.salon.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count(),
    prisma.customer.count(),
    prisma.appointment.count(),
    prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.salon.findMany({
      include: {
        _count: { select: { customers: true, appointments: true } },
        invoices: { where: { status: "PAID" }, select: { totalAmount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.platformAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenue = Number(invoicesAggregate._sum.totalAmount ?? 0);

  ok(response, {
    metrics: {
      totalSalons,
      activeSalons,
      trialSalons,
      suspendedSalons,
      totalUsers,
      totalCustomers,
      totalAppointments,
      totalRevenue,
    },
    salons: recentSalons.map(({ invoices, ...salon }) => ({
      ...salon,
      taxRate: Number(salon.taxRate),
      paidRevenue: invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
    })),
    recentAudit,
  });
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

export async function createPlatformUser(request: Request, response: Response) {
  const name = String(request.body?.name ?? "").trim();
  const email = String(request.body?.email ?? "").trim().toLowerCase();
  const password = String(request.body?.password ?? "");
  const role = String(request.body?.role ?? "PLATFORM_ADMIN");
  const salonId = request.body?.salonId ? String(request.body.salonId) : null;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required.");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(400, "A user with this email already exists.");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: role as any,
      salonId,
      active: true,
      mustChangePassword: false,
    },
    include: { salon: { select: { id: true, salonName: true, code: true } } },
  });

  await audit(
    response.locals.user?.id,
    "USER_CREATED",
    "USER",
    user.id,
    { email: user.email, role: user.role },
  );

  const { passwordHash, ...safe } = user;
  created(response, safe);
}

export async function updatePlatformUser(request: Request, response: Response) {
  const id = String(request.params.id);
  const active = request.body?.active;
  const newPassword = request.body?.newPassword;
  const role = request.body?.role;
  const name = request.body?.name;

  const data: Record<string, any> = {};
  if (typeof active === "boolean") data.active = active;
  if (typeof role === "string") data.role = role;
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof newPassword === "string" && newPassword.length >= 8) {
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { salon: { select: { id: true, salonName: true, code: true } } },
  });

  await audit(
    response.locals.user?.id,
    newPassword ? "PASSWORD_RESET" : active !== undefined ? (active ? "USER_ENABLED" : "USER_DISABLED") : "USER_UPDATED",
    "USER",
    id,
    { email: user.email, updatedFields: Object.keys(data) },
  );

  const { passwordHash, ...safe } = user;
  ok(response, safe);
}

export async function listSubscriptions(_request: Request, response: Response) {
  const salons = await prisma.salon.findMany({
    select: {
      id: true,
      salonName: true,
      code: true,
      subscriptionPlan: true,
      status: true,
      trialEndsAt: true,
      createdAt: true,
      _count: { select: { appointments: true, customers: true, employees: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  ok(response, salons);
}

export async function listAuditLog(_request: Request, response: Response) {
  const logs = await prisma.platformAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Resolve actor user names
  const actorIds = Array.from(new Set(logs.map((l) => l.actorId).filter(Boolean))) as string[];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  ok(
    response,
    logs.map((log) => ({
      ...log,
      actor: log.actorId ? actorMap.get(log.actorId) ?? { name: "Admin", email: "" } : { name: "System", email: "" },
    })),
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
  const data = {
    ...(typeof input.platformName === "string" && {
      platformName: input.platformName.trim().slice(0, 160),
    }),
    ...(typeof input.supportEmail === "string" && {
      supportEmail: input.supportEmail.trim() || null,
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
  };
  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: data,
    create: { id: "platform", ...data },
  });
  await audit(
    response.locals.user?.id,
    "SETTINGS_UPDATED",
    "PLATFORM",
    "platform",
  );
  ok(response, settings);
}

