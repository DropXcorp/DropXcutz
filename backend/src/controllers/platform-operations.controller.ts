import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { created, ok } from "./http.controller";
import { PLATFORM_PERMISSIONS } from "../services/platform-permission.service";

const ticketInput = z.object({
  salonId: z.string().min(1).nullable().optional(),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10_000),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});
const ticketPatch = z
  .object({
    status: z
      .enum(["OPEN", "IN_PROGRESS", "WAITING_ON_SALON", "RESOLVED", "CLOSED"])
      .optional(),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    assigneeId: z.string().min(1).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
const commentInput = z.object({ body: z.string().trim().min(1).max(10_000) });
const roleInput = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9_]{1,59}$/),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5_000).nullable().optional(),
  permissions: z.array(z.enum(PLATFORM_PERMISSIONS)).min(1),
});
const bulkInput = z
  .object({
    salonIds: z
      .array(z.string().min(1))
      .min(1)
      .max(100)
      .transform((items) => [...new Set(items)]),
    status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "ARCHIVED"]).optional(),
    planId: z.string().min(1).optional(),
  })
  .refine(
    (value) => value.status !== undefined || value.planId !== undefined,
    "Choose a status and/or plan.",
  );

export async function listTickets(_request: Request, response: Response) {
  ok(
    response,
    await prisma.supportTicket.findMany({
      include: {
        salon: { select: { id: true, salonName: true, code: true } },
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
  );
}

export async function createTicket(request: Request, response: Response) {
  const input = ticketInput.parse(request.body);
  if (
    input.salonId &&
    !(await prisma.salon.findUnique({ where: { id: input.salonId } }))
  )
    throw new ApiError(404, "Salon not found.");
  created(
    response,
    await prisma.supportTicket.create({
      data: { ...input, reporterId: response.locals.user.id },
      include: { salon: true },
    }),
  );
}

export async function updateTicket(request: Request, response: Response) {
  const input = ticketPatch.parse(request.body);
  const status = input.status;
  ok(
    response,
    await prisma.supportTicket.update({
      where: { id: String(request.params.id) },
      data: {
        ...input,
        ...(status && {
          resolvedAt: ["RESOLVED", "CLOSED"].includes(status)
            ? new Date()
            : null,
        }),
      },
    }),
  );
}

export async function addTicketComment(request: Request, response: Response) {
  const ticketId = String(request.params.id);
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) throw new ApiError(404, "Support ticket not found.");
  const comment = await prisma.supportTicketComment.create({
    data: {
      ticketId,
      authorId: response.locals.user.id,
      body: commentInput.parse(request.body).body,
    },
  });
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });
  created(response, comment);
}

export async function listPlatformRoles(_request: Request, response: Response) {
  ok(
    response,
    await prisma.platformRole.findMany({
      include: { permissions: true, _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
  );
}

export async function createPlatformRole(request: Request, response: Response) {
  const input = roleInput.parse(request.body);
  const role = await prisma.platformRole.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      permissions: {
        createMany: {
          data: input.permissions.map((permission) => ({ permission })),
        },
      },
    },
    include: { permissions: true },
  });
  created(response, role);
}

export async function updatePlatformRole(request: Request, response: Response) {
  const input = roleInput
    .partial()
    .refine((value) => Object.keys(value).length > 0)
    .parse(request.body);
  const current = await prisma.platformRole.findUnique({
    where: { id: String(request.params.id) },
  });
  if (!current) throw new ApiError(404, "Platform role not found.");
  if (current.isSystem && input.permissions)
    throw new ApiError(409, "System role permissions cannot be changed.");
  const role = await prisma.$transaction(async (tx) => {
    if (input.permissions)
      await tx.platformRolePermission.deleteMany({
        where: { roleId: current.id },
      });
    return tx.platformRole.update({
      where: { id: current.id },
      data: {
        ...(input.code && { code: input.code }),
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.permissions && {
          permissions: {
            createMany: {
              data: input.permissions.map((permission) => ({ permission })),
            },
          },
        }),
      },
      include: { permissions: true },
    });
  });
  ok(response, role);
}

export async function runBulkSalonUpdate(request: Request, response: Response) {
  const input = bulkInput.parse(request.body);
  const actorId = response.locals.user.id as string;
  const salons = await prisma.salon.findMany({
    where: { id: { in: input.salonIds } },
    select: { id: true },
  });
  if (salons.length !== input.salonIds.length)
    throw new ApiError(404, "One or more salons were not found.");
  const plan = input.planId
    ? await prisma.plan.findUnique({ where: { id: input.planId } })
    : null;
  if (input.planId && !plan) throw new ApiError(404, "Plan not found.");
  const operation = await prisma.platformBulkOperation.create({
    data: {
      actorId,
      type: "SALON_UPDATE",
      status: "RUNNING",
      input,
      items: {
        createMany: {
          data: input.salonIds.map((salonId) => ({
            salonId,
            status: "RUNNING",
          })),
        },
      },
    },
  });
  const results: Array<{ salonId: string; error?: string }> = [];
  for (const salonId of input.salonIds) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.salon.update({
          where: { id: salonId },
          data: {
            ...(input.status && {
              status: input.status,
              archivedAt:
                input.status === "ARCHIVED"
                  ? new Date()
                  : input.status === "ACTIVE"
                    ? null
                    : undefined,
            }),
            ...(plan && { planId: plan.id, subscriptionPlan: plan.name }),
          },
        });
        if (plan)
          await tx.subscription.updateMany({
            where: {
              salonId,
              status: { in: ["ACTIVE", "TRIAL", "SUSPENDED"] },
            },
            data: {
              planId: plan.id,
              monthlyPrice: plan.monthlyPrice,
              annualPrice: plan.annualPrice,
            },
          });
        await tx.platformBulkOperationItem.updateMany({
          where: { operationId: operation.id, salonId },
          data: { status: "COMPLETED" },
        });
      });
      results.push({ salonId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed.";
      await prisma.platformBulkOperationItem.updateMany({
        where: { operationId: operation.id, salonId },
        data: { status: "FAILED", error: message },
      });
      results.push({ salonId, error: message });
    }
  }
  const failures = results.filter((result) => result.error).length;
  const status =
    failures === 0
      ? "COMPLETED"
      : failures === results.length
        ? "FAILED"
        : "PARTIALLY_COMPLETED";
  ok(
    response,
    await prisma.platformBulkOperation.update({
      where: { id: operation.id },
      data: {
        status,
        result: { updated: results.length - failures, failed: failures },
        completedAt: new Date(),
      },
      include: { items: true },
    }),
  );
}
