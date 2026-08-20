import { z } from "zod";

const optionalEmail = z.preprocess(
  (value) => (value == null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.string().email("Enter a valid email address.").optional(),
);

export const employeeForm = z.object({
  name: z.string().trim().min(1, "Staff name is required."),
  role: z.string().trim().min(1, "Role is required."),
  phone: z.string().trim().min(5, "Enter a valid phone number."),
  email: optionalEmail,
  baseSalary: z.coerce.number().finite().min(0, "Salary cannot be negative."),
});

export function validationMessage(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Check the form values.";
  return error instanceof Error ? error.message : "Check the form values.";
}
