import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import { z } from "zod";
const dto = (x: any) => ({
  id: x.id,
  customerId: x.customerId,
  customerName: x.customer.name,
  appointmentId: x.appointmentId,
  employeeId: x.employeeId,
  rating: x.rating,
  comment: x.review,
  status: x.status,
  createdAt: x.createdAt,
});


const user = (r: Response) => String(r.locals.user.id);
export const reviewRouter = Router();
async function get(salon: string, id: string) {
  const item = await prisma.review.findFirst({
    where: { id, salonId: salon },
    include: { customer: { select: { name: true } } },
  });
  if (!item) throw new ApiError(404, "Review not found.");
  return item;
}
reviewRouter.get("/", async (req: Request, res: Response) => {
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  ok(
    res,
    (
      await prisma.review.findMany({
        where: {
          salonId: salonId(res),
          ...(status && { status: status as any }),
        },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
    ).map(dto),
  );
});

const reviewInput = z.object({
  customerId: z.string().min(1),
  appointmentId: z.string().min(1).optional().nullable(),
  employeeId: z.string().min(1).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(5000).optional().nullable(),
});

reviewRouter.post("/", requireSalonAdmin, async (req, res) => {
  const input = reviewInput.parse(req.body);
  const salon = salonId(res);
  if (!(await prisma.customer.findFirst({ where: { id: input.customerId, salonId: salon } })))
    throw new ApiError(404, "Customer not found.");
  if (input.appointmentId && !(await prisma.appointment.findFirst({ where: { id: input.appointmentId, salonId: salon } })))
    throw new ApiError(404, "Appointment not found.");
  if (input.employeeId && !(await prisma.employee.findFirst({ where: { id: input.employeeId, salonId: salon } })))
    throw new ApiError(404, "Employee not found.");
  const item = await prisma.$transaction(async (client) => {
    const created = await client.review.create({
      data: {
        salonId: salon,
        customerId: input.customerId,
        appointmentId: input.appointmentId || null,
        employeeId: input.employeeId || null,
        rating: input.rating,
        review: input.comment || null,
      },
      include: { customer: { select: { name: true } } },
    });
    await client.salonAuditLog.create({
      data: { salonId: salon, userId: user(res), action: "CREATE", entity: "Review", entityId: created.id, newValue: dto(created) },
    });
    return created;
  });
  res.status(201).json({ data: dto(item) });
});


reviewRouter.patch("/:id/approve", requireSalonAdmin, async (req, res) => {
  await get(salonId(res), String(req.params.id));
  const item = await prisma.$transaction(async (c) => {
    const x = await c.review.update({
      where: { id: String(req.params.id) },
      data: { status: "APPROVED" },
      include: { customer: { select: { name: true } } },
    });
    await c.salonAuditLog.create({
      data: {
        salonId: salonId(res),
        userId: user(res),
        action: "APPROVE",
        entity: "Review",
        entityId: x.id,
        newValue: dto(x),
      },
    });
    return x;
  });
  ok(res, dto(item));
});


reviewRouter.patch("/:id/reject", requireSalonAdmin, async (req, res) => {
  await get(salonId(res), String(req.params.id));
  ok(
    res,
    dto(
      await prisma.review.update({
        where: { id: String(req.params.id) },
        data: { status: "REJECTED" },
        include: { customer: { select: { name: true } } },
      }),
    ),
  );
});


reviewRouter.delete("/:id", requireSalonAdmin, async (req, res) => {
  await get(salonId(res), String(req.params.id));
  await prisma.review.delete({ where: { id: String(req.params.id) } });
  res.status(204).end();
});
