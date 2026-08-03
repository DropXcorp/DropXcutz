import { z } from "zod";
export const offerInput = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(5000).optional().nullable(),
    bannerImage: z.string().trim().url().max(2000).optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    discount: z.coerce.number().positive(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
    isActive: z.boolean().default(true),
  })
  .refine((x) => x.endDate > x.startDate, {
    path: ["endDate"],
    message: "End date must follow start date.",
  });
