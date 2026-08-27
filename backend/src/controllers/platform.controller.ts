import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import {
  salonCreateInput,
  salonPatchInput,
} from "../validators/salon.validator";
import { created, ok } from "./http.controller";
import { getEffectiveFeatures } from "../services/feature.service";
import { planFeaturesInput, planInput, salonFeatureInput, subscriptionInput, websiteSettingsInput } from "../validators/plan.validator";
import { notificationInput, platformSettingsInput, platformUserCreateInput, platformUserPatchInput } from "../validators/platform.validator";

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
        slug: input.slug ?? input.code,
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
    const plan = await tx.plan.findFirst({ where: { name: { equals: salon.subscriptionPlan, mode: "insensitive" } } });
    if (plan) {
      await tx.salon.update({ where: { id: salon.id }, data: { planId: plan.id } });
      await tx.subscription.create({ data: { salonId: salon.id, planId: plan.id, status: salon.status === "TRIAL" ? "TRIAL" : "ACTIVE", expiresAt: salon.trialEndsAt } });
    }
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
  const { salonId: target, title, message } = notificationInput.parse(request.body);
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
  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.salon.update({ where: { id }, data: input });
    if (input.subscriptionPlan !== undefined) {
      const plan = await tx.plan.findFirst({ where: { name: { equals: input.subscriptionPlan, mode: "insensitive" } } });
      if (!plan) throw new ApiError(400, "Select a valid configured plan.");
      await tx.salon.update({ where: { id }, data: { planId: plan.id, subscriptionPlan: plan.name } });
      const currentSubscription = await tx.subscription.findFirst({ where: { salonId: id }, orderBy: { createdAt: "desc" } });
      if (currentSubscription) await tx.subscription.update({ where: { id: currentSubscription.id }, data: { planId: plan.id } });
      else await tx.subscription.create({ data: { salonId: id, planId: plan.id, status: updated.status === "TRIAL" ? "TRIAL" : "ACTIVE", expiresAt: updated.trialEndsAt } });
    }
    return updated;
  });
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
  const { name, email, password, role, salonId = null } = platformUserCreateInput.parse(request.body);

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
  const { active, newPassword, role, name, salonId } = platformUserPatchInput.parse(request.body);
  const current = await prisma.user.findUniqueOrThrow({ where: { id }, select: { role: true, salonId: true } });
  const nextRole = role ?? current.role;
  const nextSalonId = salonId === undefined ? current.salonId : salonId;
  if (nextRole !== "PLATFORM_ADMIN" && !nextSalonId)
    throw new ApiError(400, "Salon users must be assigned to a salon.");

  const data: Record<string, any> = {};
  if (typeof active === "boolean") data.active = active;
  if (typeof role === "string") data.role = role;
  if (salonId !== undefined) data.salonId = salonId;
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
  const input = platformSettingsInput.parse(request.body);
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

export async function listPlans(_request: Request, response: Response) {
  ok(response, await prisma.plan.findMany({ include: { features: { include: { feature: true } }, _count: { select: { subscriptions: true } } }, orderBy: { name: "asc" } }));
}

export async function getPlan(request: Request, response: Response) {
  const plan = await prisma.plan.findUnique({ where: { id: String(request.params.id) }, include: { features: { include: { feature: true } } } });
  if (!plan) throw new ApiError(404, "Plan not found.");
  ok(response, plan);
}

export async function createPlan(request: Request, response: Response) {
  const input = planInput.parse(request.body);
  const plan = await prisma.plan.create({ data: input });
  await audit(response.locals.user?.id, "PLAN_CREATED", "PLAN", plan.id, { code: plan.code });
  created(response, plan);
}

export async function updatePlan(request: Request, response: Response) {
  const input = planInput.partial().parse(request.body);
  const plan = await prisma.plan.update({ where: { id: String(request.params.id) }, data: input });
  await audit(response.locals.user?.id, "PLAN_UPDATED", "PLAN", plan.id, input);
  ok(response, plan);
}

export async function setPlanFeatures(request: Request, response: Response) {
  const planId = String(request.params.id);
  const { featureCodes } = planFeaturesInput.parse(request.body);
  await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  const features = await prisma.feature.findMany({ where: { code: { in: featureCodes } } });
  if (features.length !== new Set(featureCodes).size) throw new ApiError(400, "One or more feature codes are invalid.");
  await prisma.$transaction([
    prisma.planFeature.deleteMany({ where: { planId } }),
    prisma.planFeature.createMany({ data: features.map((feature) => ({ planId, featureId: feature.id, enabled: true })) }),
  ]);
  await audit(response.locals.user?.id, "PLAN_FEATURES_UPDATED", "PLAN", planId, { featureCodes });
  ok(response, await prisma.plan.findUnique({ where: { id: planId }, include: { features: { include: { feature: true } } } }));
}

export async function listFeatures(_request: Request, response: Response) {
  ok(response, await prisma.feature.findMany({ orderBy: { code: "asc" } }));
}

export async function getSalonSubscription(request: Request, response: Response) {
  const salonId = String(request.params.id);
  ok(response, await prisma.subscription.findFirst({ where: { salonId }, orderBy: { createdAt: "desc" }, include: { plan: true } }));
}

export async function createSubscription(request: Request, response: Response) {
  const salonId = String(request.params.id); const input = subscriptionInput.parse(request.body);
  await prisma.salon.findUniqueOrThrow({ where: { id: salonId } });
  const subscription = await prisma.$transaction(async (tx) => {
    const createdSubscription = await tx.subscription.create({ data: { salonId, ...input } });
    await tx.salon.update({ where: { id: salonId }, data: { planId: input.planId, subscriptionPlan: (await tx.plan.findUniqueOrThrow({ where: { id: input.planId } })).name } });
    return createdSubscription;
  });
  await audit(response.locals.user?.id, "SUBSCRIPTION_CREATED", "SUBSCRIPTION", subscription.id, { salonId, planId: input.planId });
  created(response, subscription);
}

export async function updateSubscription(request: Request, response: Response) {
  const salonId = String(request.params.id); const input = subscriptionInput.partial().parse(request.body);
  const current = await prisma.subscription.findFirst({ where: { salonId }, orderBy: { createdAt: "desc" } });
  if (!current) throw new ApiError(404, "Subscription not found.");
  const subscription = await prisma.subscription.update({ where: { id: current.id }, data: input });
  if (input.planId) {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { id: input.planId } });
    await prisma.salon.update({ where: { id: salonId }, data: { planId: plan.id, subscriptionPlan: plan.name } });
  }
  await audit(response.locals.user?.id, "SUBSCRIPTION_UPDATED", "SUBSCRIPTION", subscription.id, input);
  ok(response, subscription);
}

export async function renewSubscription(request: Request, response: Response) {
  const salonId = String(request.params.id);
  const input = subscriptionInput.parse(request.body);
  const subscription = await prisma.$transaction(async (tx) => {
    const plan = await tx.plan.findUniqueOrThrow({ where: { id: input.planId } });
    await tx.subscription.updateMany({ where: { salonId, status: { in: ["ACTIVE", "TRIAL"] } }, data: { status: "EXPIRED", expiresAt: new Date() } });
    const renewed = await tx.subscription.create({ data: { salonId, ...input, status: "ACTIVE", startsAt: input.startsAt ?? new Date() } });
    await tx.salon.update({ where: { id: salonId }, data: { planId: plan.id, subscriptionPlan: plan.name, status: "ACTIVE" } });
    return renewed;
  });
  await audit(response.locals.user?.id, "SUBSCRIPTION_RENEWED", "SUBSCRIPTION", subscription.id, { salonId, planId: input.planId });
  created(response, subscription);
}

export async function getSalonFeatureOverrides(request: Request, response: Response) {
  const salonId = String(request.params.id);
  ok(response, await getEffectiveFeatures(salonId));
}

export async function setSalonFeatureOverride(request: Request, response: Response) {
  const salonId = String(request.params.id); const { code, enabled } = salonFeatureInput.parse(request.body);
  const feature = await prisma.feature.findUnique({ where: { code } }); if (!feature) throw new ApiError(404, "Feature not found.");
  await prisma.salonFeature.upsert({ where: { salonId_featureId: { salonId, featureId: feature.id } }, create: { salonId, featureId: feature.id, enabled }, update: { enabled } });
  await audit(response.locals.user?.id, "FEATURE_OVERRIDE_SET", "SALON", salonId, { code, enabled });
  ok(response, await getEffectiveFeatures(salonId));
}

export async function getSalonWebsiteSettings(request: Request, response: Response) {
  ok(response, await prisma.salonWebsiteSettings.findUnique({ where: { salonId: String(request.params.id) } }));
}

export async function upsertSalonWebsiteSettings(request: Request, response: Response) {
  const salonId = String(request.params.id); const input = websiteSettingsInput.parse(request.body);
  const { theme, ...rest } = input;
  const data = { ...rest, ...(theme !== undefined ? { theme: JSON.parse(JSON.stringify(theme)) } : {}) };
  const website = await prisma.salonWebsiteSettings.upsert({ where: { salonId }, create: { salonId, ...data }, update: data });
  await audit(response.locals.user?.id, "WEBSITE_SETTINGS_UPDATED", "SALON", salonId, { type: input.type });
  ok(response, website);
}

