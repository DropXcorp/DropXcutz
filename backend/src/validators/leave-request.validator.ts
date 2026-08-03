import { z } from "zod";
export const leaveApplyInput = z
  .object({
    employeeId: z.string().trim().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().max(5000).optional().nullable(),
  })
  .refine((value) => value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "End date must be on or after start date.",
  });
export const leaveStatusInput = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
});
export const leaveQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  employeeId: z.string().trim().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
});
