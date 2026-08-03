import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time.");
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const branchInput = z
  .object({
    name: z.string().trim().min(1).max(160),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(1)
      .max(60)
      .regex(
        /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/,
        "Use letters, numbers, and hyphens only.",
      ),
    phone: optionalText(30),
    email: z.string().trim().email().max(200).optional().nullable(),
    address: optionalText(5_000),
    city: optionalText(100),
    state: optionalText(100),
    postalCode: optionalText(20),
    latitude: z.coerce.number().finite().min(-90).max(90).optional().nullable(),
    longitude: z.coerce
      .number()
      .finite()
      .min(-180)
      .max(180)
      .optional()
      .nullable(),
    openingTime: time.default("09:00"),
    closingTime: time.default("20:00"),
    isActive: z.boolean().default(true),
  })
  .refine((input) => input.openingTime < input.closingTime, {
    message: "Opening time must be before closing time.",
    path: ["closingTime"],
  });

export const branchPatch = branchInput.partial();
export const branchListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  sortBy: z
    .enum(["name", "code", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
