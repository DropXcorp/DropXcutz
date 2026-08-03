import { z } from "zod";
export const employeeServiceInput = z.object({
  employeeId: z.string().trim().min(1),
  serviceId: z.string().trim().min(1),
});
export const employeeServiceParams = z.object({
  employeeId: z.string().trim().min(1),
  serviceId: z.string().trim().min(1),
});
