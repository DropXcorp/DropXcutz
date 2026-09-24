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
import { sendEmail } from "../services/email.service";
import { toCsv } from "../services/csv.service";
import { notifySiteChanged, verifyDomain } from "../services/domain-automation.service";
import { describeWebsite, saveWebsiteSettings, setCustomDomain, websiteSettingsPatch } from "../services/website.service";

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
    salons.map(({ invoices, razorpayKeySecretCipher: _keySecret, razorpayWebhookCipher: _webhookSecret, ...salon }) => ({
      ...salon,
      taxRate: Number(salon.taxRate),
      paidRevenue: invoices.reduce(
        (sum, invoice) => sum + Number(invoice.totalAmount),
        0,
      ),
    })),
  );
}

export async function listSalonsCsv(_request: Request, response: Response) {
  const salons = await prisma.salon.findMany({
    include: { invoices: { where: { status: "PAID" }, select: { totalAmount: true } } },
    orderBy: { createdAt: "desc" },
  });
  const rows: Array<Array<string | number>> = [
    ["Salon", "Code", "Status", "Plan", "Email", "City", "Trial ends", "Paid revenue", "Created"],
    ...salons.map((salon) => [
      salon.salonName,
      salon.code,
      salon.status,
      salon.subscriptionPlan,
      salon.email ?? "",
      salon.city ?? "",
      salon.trialEndsAt?.toISOString().slice(0, 10) ?? "",
      salon.invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0),
      salon.createdAt.toISOString().slice(0, 10),
    ]),
  ];
  response.setHeader("content-type", "text/csv; charset=utf-8");
  response.setHeader("content-disposition", `attachment; filename="dropxcutz-salons-${new Date().toISOString().slice(0, 10)}.csv"`);
  response.send(toCsv(rows));
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
  const { invoices, razorpayKeySecretCipher: _keySecret, razorpayWebhookCipher: _webhookSecret, ...data } = salon;
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
  const erpUrl = process.env.SALON_ERP_URL?.trim();
  void sendEmail({
    to: normalizedAdminEmail,
    subject: `Welcome to DropXcutz, ${item.salonName}`,
    html: `<p>Your DropXcutz salon admin account is ready.</p>
      <p>Salon: ${item.salonName} (${item.code})</p>
      ${erpUrl ? `<p>ERP URL: <a href="${erpUrl}">${erpUrl}</a></p>` : ""}
      <p>Email: ${normalizedAdminEmail}<br/>Temporary password: ${adminPassword}</p>
      <p>You will be asked to change this password on first login.</p>`,
  }).catch((error) => console.error("Welcome email send failed", error));
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
    if (input.status === "ACTIVE") {
      const hasLiveSubscription = await tx.subscription.findFirst({
        where: { salonId: id, status: { in: ["ACTIVE", "TRIAL"] } },
      });
      if (!hasLiveSubscription) {
        const lastSubscription = await tx.subscription.findFirst({
          where: { salonId: id },
          orderBy: { createdAt: "desc" },
        });
        const planId = lastSubscription?.planId ?? updated.planId;
        if (!planId)
          throw new ApiError(409, "Assign a subscription plan before activating this salon, or its subscription will expire again immediately.");
        await tx.subscription.create({
          data: {
            salonId: id,
            planId,
            status: "ACTIVE",
            billingCycle: lastSubscription?.billingCycle ?? null,
            monthlyPrice: lastSubscription?.monthlyPrice ?? null,
            annualPrice: lastSubscription?.annualPrice ?? null,
            expiresAt: null,
          },
        });
      }
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
    data: { status: "ARCHIVED", archivedAt: new Date() },
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

export async function restoreSalon(request: Request, response: Response) {
  const id = String(request.params.id);
  const current = await prisma.salon.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Salon not found.");
  if (current.status !== "ARCHIVED") {
    throw new ApiError(409, "Only archived salons can be restored.");
  }

  const item = await prisma.salon.update({
    where: { id },
    data: { status: "SUSPENDED", archivedAt: null },
  });
  await audit(response.locals.user?.id, "SALON_RESTORED", "SALON", id, {
    salonName: item.salonName,
  });
  ok(response, { ...item, taxRate: Number(item.taxRate) });
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

  const trendDays = 14;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (trendDays - 1));
  const [trendSalons, trendInvoices] = await Promise.all([
    prisma.salon.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.invoice.findMany({
      where: { status: "PAID", issuedAt: { gte: since } },
      select: { issuedAt: true, totalAmount: true },
    }),
  ]);
  const trends = Array.from({ length: trendDays }, (_, index) => {
    const day = new Date(since);
    day.setUTCDate(since.getUTCDate() + index);
    return { date: day.toISOString().slice(0, 10), newSalons: 0, revenue: 0 };
  });
  const trendByDate = new Map(trends.map((item) => [item.date, item]));
  for (const salon of trendSalons) {
    const bucket = trendByDate.get(salon.createdAt.toISOString().slice(0, 10));
    if (bucket) bucket.newSalons += 1;
  }
  for (const invoice of trendInvoices) {
    const bucket = trendByDate.get(invoice.issuedAt.toISOString().slice(0, 10));
    if (bucket) bucket.revenue += Number(invoice.totalAmount);
  }

  ok(response, {
    trends,
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
    salons: recentSalons.map(({ invoices, razorpayKeySecretCipher: _keySecret, razorpayWebhookCipher: _webhookSecret, ...salon }) => ({
      ...salon,
      taxRate: Number(salon.taxRate),
      paidRevenue: invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
    })),
    recentAudit,
  });
}

export const audit = (
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
    include: { salon: { select: { id: true, salonName: true, code: true } }, platformRole: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  ok(
    response,
    users.map(({ passwordHash, ...user }) => user),
  );
}

export async function createPlatformUser(request: Request, response: Response) {
  const { name, email, password, role, salonId = null, platformRoleId = null } = platformUserCreateInput.parse(request.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(400, "A user with this email already exists.");
  }
  if (platformRoleId && !await prisma.platformRole.findUnique({ where: { id: platformRoleId } })) {
    throw new ApiError(404, "Platform role not found.");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: role as any,
      salonId,
      platformRoleId: role === "PLATFORM_ADMIN" ? platformRoleId : null,
      active: true,
      mustChangePassword: false,
    },
    include: { salon: { select: { id: true, salonName: true, code: true } }, platformRole: { select: { id: true, name: true } } },
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
  const { active, newPassword, role, name, salonId, platformRoleId } = platformUserPatchInput.parse(request.body);
  const current = await prisma.user.findUniqueOrThrow({ where: { id }, select: { role: true, salonId: true } });
  const nextRole = role ?? current.role;
  const nextSalonId = salonId === undefined ? current.salonId : salonId;
  if (nextRole !== "PLATFORM_ADMIN" && !nextSalonId)
    throw new ApiError(400, "Salon users must be assigned to a salon.");
  if (platformRoleId && !await prisma.platformRole.findUnique({ where: { id: platformRoleId } })) {
    throw new ApiError(404, "Platform role not found.");
  }

  const data: Record<string, any> = {};
  if (typeof active === "boolean") data.active = active;
  if (typeof role === "string") data.role = role;
  if (salonId !== undefined) data.salonId = salonId;
  if (platformRoleId !== undefined) data.platformRoleId = nextRole === "PLATFORM_ADMIN" ? platformRoleId : null;
  if (role && role !== "PLATFORM_ADMIN") data.platformRoleId = null;
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof newPassword === "string" && newPassword.length >= 8) {
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { salon: { select: { id: true, salonName: true, code: true } }, platformRole: { select: { id: true, name: true } } },
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

export async function revokeUserSessions(request: Request, response: Response) {
  const id = String(request.params.id);
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
  if (!user) throw new ApiError(404, "User not found.");
  const { count } = await prisma.session.deleteMany({ where: { userId: id } });
  await audit(response.locals.user?.id, "USER_SESSIONS_REVOKED", "USER", id, { email: user.email, revokedCount: count });
  ok(response, { revokedCount: count });
}

export async function listSessions(request: Request, response: Response) {
  const impersonatedOnly = String(request.query.impersonatedOnly ?? "") === "true";
  const sessions = await prisma.session.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(impersonatedOnly ? { impersonatedByUserId: { not: null } } : {}),
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      expiresAt: true,
      ipAddress: true,
      impersonatedByUserId: true,
      user: { select: { name: true, email: true, salon: { select: { salonName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const adminIds = Array.from(new Set(sessions.map((s) => s.impersonatedByUserId).filter(Boolean))) as string[];
  const admins = adminIds.length
    ? await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, name: true, email: true } })
    : [];
  const adminMap = new Map(admins.map((a) => [a.id, a]));

  ok(
    response,
    sessions.map((session) => ({
      ...session,
      impersonatedBy: session.impersonatedByUserId
        ? adminMap.get(session.impersonatedByUserId) ?? { name: "Platform admin", email: "" }
        : null,
    })),
  );
}

export async function revokeSession(request: Request, response: Response) {
  const id = String(request.params.id);
  const session = await prisma.session.findUnique({ where: { id }, select: { id: true, userId: true, impersonatedByUserId: true } });
  if (!session) throw new ApiError(404, "Session not found.");
  await prisma.session.delete({ where: { id } });
  await audit(response.locals.user?.id, "SESSION_REVOKED", "USER", session.userId, {
    sessionId: id,
    wasImpersonation: !!session.impersonatedByUserId,
  });
  response.status(204).end();
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

export async function listAuditLogCsv(_request: Request, response: Response) {
  const logs = await prisma.platformAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  const actorIds = Array.from(new Set(logs.map((l) => l.actorId).filter(Boolean))) as string[];
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));
  const rows: Array<Array<string | number>> = [
    ["Timestamp", "Actor", "Action", "Entity", "Entity ID", "Details"],
    ...logs.map((log) => [
      log.createdAt.toISOString(),
      log.actorId ? (actorMap.get(log.actorId)?.name ?? "Admin") : "System",
      log.action,
      log.entity,
      log.entityId ?? "",
      log.details ? JSON.stringify(log.details) : "",
    ]),
  ];
  response.setHeader("content-type", "text/csv; charset=utf-8");
  response.setHeader("content-disposition", `attachment; filename="dropxcutz-audit-log-${new Date().toISOString().slice(0, 10)}.csv"`);
  response.send(toCsv(rows));
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

export async function cancelSubscription(request: Request, response: Response) {
  const salonId = String(request.params.id);
  const current = await prisma.subscription.findFirst({ where: { salonId }, orderBy: { createdAt: "desc" } });
  if (!current) throw new ApiError(404, "Subscription not found.");
  const subscription = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.subscription.update({ where: { id: current.id }, data: { status: "CANCELLED", expiresAt: new Date() } });
    await tx.salon.update({ where: { id: salonId }, data: { status: "SUSPENDED" } });
    return cancelled;
  });
  await audit(response.locals.user?.id, "SUBSCRIPTION_CANCELLED", "SUBSCRIPTION", subscription.id, { salonId });
  ok(response, subscription);
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
  await syncWebsiteWithFeature(salonId, code, enabled);
  ok(response, await getEffectiveFeatures(salonId));
}

/** Granting a website feature pre-creates a draft site; revoking one takes the live site offline. */
async function syncWebsiteWithFeature(salonId: string, code: string, enabled: boolean) {
  const websiteCodes = ["TEMPLATE_WEBSITE", "CUSTOM_WEBSITE", "ONLINE_BOOKING"];
  if (!websiteCodes.includes(code)) return;
  const existing = await prisma.salonWebsiteSettings.findUnique({ where: { salonId } });
  if (enabled && code === "TEMPLATE_WEBSITE" && !existing) {
    const salon = await prisma.salon.findUniqueOrThrow({ where: { id: salonId }, select: { salonName: true } });
    await prisma.salonWebsiteSettings.create({ data: { salonId, type: "TEMPLATE", templateId: "classic", title: salon.salonName, isPublished: false } });
  }
  if (!enabled && existing?.isPublished) {
    await prisma.salonWebsiteSettings.update({ where: { salonId }, data: { isPublished: false } });
    void notifySiteChanged();
  }
}

export async function getSalonWebsiteSettings(request: Request, response: Response) {
  ok(response, await describeWebsite(String(request.params.id)));
}

export async function upsertSalonWebsiteSettings(request: Request, response: Response) {
  const salonId = String(request.params.id);
  await prisma.salon.findUniqueOrThrow({ where: { id: salonId }, select: { id: true } });
  const body = (request.body ?? {}) as { customDomain?: string | null };
  const input = websiteSettingsPatch.parse(request.body);
  await saveWebsiteSettings(salonId, input);
  if (body.customDomain !== undefined) await setCustomDomain(salonId, body.customDomain);
  await audit(response.locals.user?.id, "WEBSITE_SETTINGS_UPDATED", "SALON", salonId, {
    type: input.type,
    isPublished: input.isPublished,
    customDomain: body.customDomain,
  });
  void notifySiteChanged();
  ok(response, await describeWebsite(salonId));
}

export async function verifySalonDomain(request: Request, response: Response) {
  const salonId = String(request.params.id);
  await verifyDomain(salonId);
  await audit(response.locals.user?.id, "WEBSITE_DOMAIN_VERIFY_REQUESTED", "SALON", salonId);
  ok(response, await describeWebsite(salonId));
}


export async function listWebsites(_request: Request, response: Response) {
  const rows = await prisma.salonWebsiteSettings.findMany({
    include: { salon: { select: { id: true, salonName: true, code: true, slug: true, status: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const root = process.env.PUBLIC_ROOT_DOMAIN?.trim();
  const scheme = process.env.NODE_ENV === "production" ? "https" : "http";
  ok(
    response,
    rows.map((row) => {
      const custom = row.customDomain && row.domainStatus === "ACTIVE" ? `https://${row.customDomain}` : null;
      const subdomain = root ? `${scheme}://${row.salon.slug}.${root}` : null;
      return {
        salonId: row.salonId,
        salonName: row.salon.salonName,
        code: row.salon.code,
        slug: row.salon.slug,
        salonStatus: row.salon.status,
        type: row.type,
        isPublished: row.isPublished,
        publishedAt: row.publishedAt,
        customDomain: row.customDomain,
        domainStatus: row.domainStatus,
        domainError: row.domainError,
        liveUrl: row.isPublished ? (custom ?? subdomain) : null,
        updatedAt: row.updatedAt,
      };
    }),
  );
}

export async function getSystemStatus(_request: Request, response: Response) {
  const { collectSystemStatus } = await import("../services/system-status.service");
  ok(response, await collectSystemStatus());
}
