import { prisma } from "../../config/prisma";
import { ApiError } from "../../middleware/error.middleware";

const dto = (x: any) => ({
  ...x,
  discountValue: Number(x.discountValue),
  maxDiscount: x.maxDiscount === null ? null : Number(x.maxDiscount),
  minimumOrder: Number(x.minimumOrder),
});

export async function applyCoupon(
  salonId: string,
  code: string,
  orderAmount: number,
  client: { coupon: { findFirst: (args: any) => Promise<any> } } = prisma,
) {
  const coupon = await client.coupon.findFirst({
    where: { salonId, code: code.trim().toUpperCase(), isActive: true },
  });
  if (!coupon || (coupon.expiryDate && coupon.expiryDate < new Date()))
    throw new ApiError(400, "Coupon is invalid or expired.");
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    throw new ApiError(400, "This coupon has reached its usage limit.");
  if (orderAmount < Number(coupon.minimumOrder))
    throw new ApiError(400, "Minimum order amount is not met.");
  let discount =
    coupon.discountType === "PERCENTAGE"
      ? (orderAmount * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);
  if (coupon.maxDiscount !== null)
    discount = Math.min(discount, Number(coupon.maxDiscount));
  discount = Math.min(discount, orderAmount);
  return {
    coupon: dto(coupon),
    discount,
    finalAmount: Math.max(0, orderAmount - discount),
  };
}

/** Atomically reserves one redemption of a coupon so concurrent checkouts can't exceed usageLimit. */
export async function claimCoupon(
  client: { coupon: { updateMany: (args: any) => Promise<{ count: number }> } },
  couponId: string,
  usageLimit: number | null,
) {
  const claimed = await client.coupon.updateMany({
    where: {
      id: couponId,
      ...(usageLimit !== null ? { usedCount: { lt: usageLimit } } : {}),
    },
    data: { usedCount: { increment: 1 } },
  });
  return claimed.count === 1;
}
