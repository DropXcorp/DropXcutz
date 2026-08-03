import { z } from "zod";
const category = z.enum([
  "RENT",
  "SALARY",
  "ELECTRICITY",
  "INTERNET",
  "MARKETING",
  "CLEANING",
  "MISCELLANEOUS",
]);
export const expenseInput = z.object({
  branchId: z.string().trim().min(1).optional().nullable(),
  category,
  title: z.string().trim().min(1).max(160),
  amount: z.coerce.number().positive().max(999999999.99),
  date: z.coerce.date().optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
});
export const expensePatch = expenseInput.partial();
export const expenseQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  branchId: z.string().trim().optional(),
  category: category.optional(),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
});
