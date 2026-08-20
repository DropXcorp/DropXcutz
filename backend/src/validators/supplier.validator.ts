import { z } from "zod";
const optional = (max: number) =>
  z.string().trim().max(max).optional().nullable();
const optionalEmail = z.preprocess(
  (value) => (value == null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.string().trim().email().max(200).optional().nullable(),
);
export const supplierInput = z.object({
  name: z.string().trim().min(1).max(160),
  contactPerson: optional(160),
  phone: optional(30),
  email: optionalEmail,
  gstNumber: optional(20),
  address: optional(5000),
  city: optional(100),
  state: optional(100),
  notes: optional(5000),
});
export const supplierPatch = supplierInput.partial();
export const supplierQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(160).optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
