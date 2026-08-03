import { z } from "zod";
export const paymentInput = z
  .object({
    invoiceId: z.string().min(1).optional().nullable(),
    appointmentId: z.string().min(1).optional().nullable(),
    customerId: z.string().min(1).optional().nullable(),
    amount: z.coerce.number().positive(),
    method: z.enum(["CASH", "CARD", "UPI", "WALLET", "ONLINE"]),
    transactionId: z.string().trim().max(160).optional().nullable(),
  })
  .refine(
    (v) => v.invoiceId || v.appointmentId || v.customerId,
    "Provide an invoice, appointment, or customer.",
  );

  
export const paymentQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  method: z.enum(["CASH", "CARD", "UPI", "WALLET", "ONLINE"]).optional(),
  status: z.enum(["PAID", "REFUNDED"]).optional(),
});
