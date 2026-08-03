import { z } from "zod";
export const packageInput = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  price: z.coerce.number().positive(),
  validityDays: z.coerce.number().int().positive(),
  isActive: z.boolean().default(true),
});
export const packageServiceInput = z.object({
  serviceId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});
