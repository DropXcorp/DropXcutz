import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { created, ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import { requireFeature } from "../../middleware/feature.middleware";
import {
  couponInput,
  couponPatch,
  couponValidation,
} from "../../validators/coupon.validator";
import { applyCoupon } from "./coupon.service";
const dto = (x: any) => ({
  ...x,
  discountValue: Number(x.discountValue),
  maxDiscount: x.maxDiscount === null ? null : Number(x.maxDiscount),
  minimumOrder: Number(x.minimumOrder),
});

const user = (r: Response) => String(r.locals.user.id);
export const couponRouter = Router();
couponRouter.use(requireFeature("LOYALTY"));
async function get(salon: string, id: string) {
  const x = await prisma.coupon.findFirst({ where: { id, salonId: salon } });
  if (!x) throw new ApiError(404, "Coupon not found.");
  return x;
}

couponRouter.get("/", async (_q, res) =>
  ok(
    res,
    (
      await prisma.coupon.findMany({
        where: { salonId: salonId(res) },
        orderBy: { createdAt: "desc" },
      })
    ).map(dto),
  ),
);

couponRouter.post("/", requireSalonAdmin, async (req, res) => {
  const input = couponInput.parse(req.body);
  const x = await prisma.$transaction(async (c) => {
    const y = await c.coupon.create({
      data: {
        ...input,
        salonId: salonId(res),
        maxDiscount: input.maxDiscount ?? null,
        expiryDate: input.expiryDate ?? null,
      },
    });
    await c.salonAuditLog.create({
      data: {
        salonId: salonId(res),
        userId: user(res),
        action: "CREATE",
        entity: "Coupon",
        entityId: y.id,
        newValue: dto(y),
      },
    });
    return y;
  });
  created(res, dto(x));
});


couponRouter.patch("/:id", requireSalonAdmin, async (req, res) => {
  await get(salonId(res), String(req.params.id));
  ok(
    res,
    dto(
      await prisma.coupon.update({
        where: { id: String(req.params.id) },
        data: couponPatch.parse(req.body),
      }),
    ),
  );
});


couponRouter.delete("/:id", requireSalonAdmin, async (req, res) => {
  await get(salonId(res), String(req.params.id));
  await prisma.coupon.delete({ where: { id: String(req.params.id) } });
  res.status(204).end();
});


couponRouter.post("/validate", async (req: Request, res: Response) => {
  const input = couponValidation.parse(req.body);
  ok(res, await applyCoupon(salonId(res), input.code, input.orderAmount));
});
