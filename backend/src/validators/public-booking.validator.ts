import { z } from "zod";

const id = z.string().trim().min(1).max(100);

export const publicBookingInput = z.object({
  serviceId: id,
  employeeId: id,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  customer: z.object({
    name: z.string().trim().min(1).max(160),
    phone: z.string().trim().min(5).max(30),
    email: z.preprocess(
      (value) => (value == null || value === "" ? undefined : value),
      z.string().trim().email().max(200).optional(),
    ),
  }),
  notes: z.string().trim().max(1000).optional(),
  requestId: z.string().trim().uuid().optional(),
});
