import { z } from "zod";
export const serviceCategoryInput = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  image: z.string().trim().url().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const serviceCategoryPatch = serviceCategoryInput.partial();
export const serviceCategoryQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
