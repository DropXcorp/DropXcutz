import { z } from "zod";

const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9_]{1,79}$/);
const money = z.coerce
  .number()
  .finite()
  .min(0)
  .max(999_999_999.99)
  .nullable()
  .optional();

export const planInput = z.object({
  code,
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5000).nullable().optional(),
  monthlyPrice: money,
  annualPrice: money,
  isActive: z.boolean().optional(),
});
export const planFeaturesInput = z.object({
  featureCodes: z.array(code).max(100),
});
export const subscriptionInput = z.object({
  planId: z.string().min(1),
  status: z.enum(["TRIAL", "ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED"]),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  monthlyPrice: money,
  annualPrice: money,
});
export const salonFeatureInput = z.object({ code, enabled: z.boolean() });
export const websiteSettingsInput = z.object({
  type: z.enum(["NONE", "TEMPLATE", "CUSTOM"]),
  title: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  customDomain: z.string().trim().max(253).nullable().optional(),
  theme: z.json().nullable().optional(),
});
