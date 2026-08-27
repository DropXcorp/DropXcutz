import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { created, ok, salonId } from "../../controllers/http.controller";
import { ApiError } from "../../middleware/error.middleware";
import { requireSalonAdmin } from "../../middleware/session.middleware";
import { requireFeature } from "../../middleware/feature.middleware";
import {
  couponInput,
  couponValidation,
} from "../../validators/coupon.validator";
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
        data: couponInput.partial().parse(req.body),
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
  const coupon = await prisma.coupon.findFirst({
    where: { salonId: salonId(res), code: input.code, isActive: true },
  });
  if (!coupon || (coupon.expiryDate && coupon.expiryDate < new Date()))
    throw new ApiError(400, "Coupon is invalid or expired.");
  if (input.orderAmount < Number(coupon.minimumOrder))
    throw new ApiError(400, "Minimum order amount is not met.");
  let discount =
    coupon.discountType === "PERCENTAGE"
      ? (input.orderAmount * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);
  if (coupon.maxDiscount !== null)
    discount = Math.min(discount, Number(coupon.maxDiscount));
  ok(res, {
    coupon: dto(coupon),
    discount,
    finalAmount: Math.max(0, input.orderAmount - discount),
  });
});
