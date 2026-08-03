import { z } from "zod";
const attendanceStatus = z.enum([
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
]);


export const checkInInput = z.object({
  employeeId: z.string().trim().min(1),
  branchId: z.string().trim().min(1).optional().nullable(),
  checkIn: z.coerce.date().optional(),
  status: attendanceStatus.default("PRESENT"),
});


export const checkOutInput = z.object({
  attendanceId: z.string().trim().min(1),
  checkOut: z.coerce.date().optional(),
});


export const attendancePatch = z
  .object({
    checkIn: z.coerce.date().optional(),
    checkOut: z.coerce.date().optional().nullable(),
    branchId: z.string().trim().min(1).optional().nullable(),
    status: attendanceStatus.optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one value is required.",
  );


export const attendanceQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  employeeId: z.string().trim().optional(),
  branchId: z.string().trim().optional(),
  status: attendanceStatus.optional(),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
