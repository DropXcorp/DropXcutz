import { z } from "zod";
export const couponInput = z.object({
  code: z.string().trim().toUpperCase().min(1).max(60),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().positive(),
  maxDiscount: z.coerce.number().positive().optional().nullable(),
  minimumOrder: z.coerce.number().min(0).default(0),
  expiryDate: z.coerce.date().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});
export const couponValidation = z.object({
  code: z.string().trim().toUpperCase(),
  orderAmount: z.coerce.number().min(0),
});
