import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { ok, salonId } from "../../controllers/http.controller";
import { requireSalonAdmin } from "../../middleware/session.middleware";
const input = z.object({
  invoicePrefix: z.string().trim().min(1).max(12).optional(),
  currency: z.string().trim().length(3).optional(),
  timezone: z.string().trim().min(2).max(80).optional(),
  bookingWindowDays: z.coerce.number().int().min(1).max(365).optional(),
  cancellationHours: z.coerce.number().int().min(0).max(720).optional(),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  allowOnlinePayments: z.boolean().optional(),
  allowWalkIns: z.boolean().optional(),
  loyaltyEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});

export const salonSettingsRouter = Router();
salonSettingsRouter.get("/", async (_q, res) =>
  ok(
    res,
    await prisma.salonSettings.upsert({
      where: { salonId: salonId(res) },
      create: { salonId: salonId(res) },
      update: {},
    }),
  ),
);


salonSettingsRouter.put(
  "/",
  requireSalonAdmin,
  async (req: Request, res: Response) =>
    ok(
      res,
      await prisma.salonSettings.upsert({
        where: { salonId: salonId(res) },
        create: { salonId: salonId(res), ...input.parse(req.body) },
        update: input.parse(req.body),
      }),
    ),
);
