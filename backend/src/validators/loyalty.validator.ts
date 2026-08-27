import { z } from "zod";

export const loyaltyAdjustmentInput = z.object({ points: z.coerce.number().int().min(-100_000).max(100_000).refine((value) => value !== 0), description: z.string().trim().max(5000).optional() });
