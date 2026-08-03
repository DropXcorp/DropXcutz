import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { created, ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";


const slot = z
  .object({
    branchId: z.string().min(1),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    capacity: z.coerce.number().int().positive().default(1),
  })
  .refine((x) => x.endTime > x.startTime);
export const timeSlotRouter = Router();
async function owned(s: string, id: string) {
  if (
    !(await prisma.timeSlot.findFirst({
      where: { id, branch: { salonId: s } },
    }))
  )
    throw new ApiError(404, "Time slot not found.");
}


timeSlotRouter.get("/", async (req: Request, res: Response) => {
  const branchId = String(req.query.branchId ?? "");
  if (
    !(await prisma.branch.findFirst({
      where: { id: branchId, salonId: salonId(res) },
    }))
  )
    throw new ApiError(404, "Branch not found.");
  const date = String(req.query.date ?? "");
  const where = {
    branchId,
    ...(date && {
      startTime: {
        gte: new Date(`${date}T00:00:00.000Z`),
        lt: new Date(`${date}T23:59:59.999Z`),
      },
    }),
  };
  ok(
    res,
    await prisma.timeSlot.findMany({ where, orderBy: { startTime: "asc" } }),
  );
});


timeSlotRouter.post("/", requireSalonAdmin, async (req, res) => {
  const v = slot.parse(req.body);
  if (
    !(await prisma.branch.findFirst({
      where: { id: v.branchId, salonId: salonId(res) },
    }))
  )
    throw new ApiError(404, "Branch not found.");
  created(res, await prisma.timeSlot.create({ data: v }));
});


timeSlotRouter.patch("/:id/block", requireSalonAdmin, async (req, res) => {
  await owned(salonId(res), String(req.params.id));
  ok(
    res,
    await prisma.timeSlot.update({
      where: { id: String(req.params.id) },
      data: { isAvailable: false },
    }),
  );
});


timeSlotRouter.patch("/:id/release", requireSalonAdmin, async (req, res) => {
  await owned(salonId(res), String(req.params.id));
  ok(
    res,
    await prisma.timeSlot.update({
      where: { id: String(req.params.id) },
      data: { isAvailable: true },
    }),
  );
});
