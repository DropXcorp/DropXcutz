import { z } from "zod";

const requiredText = z.string().trim().min(1).max(200);
const optionalText = z.string().trim().max(5000).optional().nullable();
const money = z.coerce.number().finite().min(0).max(999_999_999.99);
const nonNegativeInt = z.coerce.number().int().min(0);
const optionalEmail = z.preprocess(
  (value) => (value == null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.string().trim().email().max(200).optional().nullable(),
);
const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
const salonCode = z
  .string()
  .transform(slug)
  .pipe(
    z
      .string()
      .min(1, "Salon code must contain at least one letter or number.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(60),
  );

export const customerInput = z.object({
  name: requiredText,
  phone: z.string().trim().min(5).max(30),
  email: optionalEmail,
  membership: z.enum(["Standard", "Silver", "Gold"]).default("Standard"),
  points: nonNegativeInt.optional(),
  totalSpend: money.optional(),
  notes: optionalText,
});

export const customerPatch = customerInput.partial();

export const employeeInput = z.object({
  name: requiredText,
  role: requiredText,
  phone: z.string().trim().min(5).max(30),
  email: optionalEmail,
  baseSalary: money,
  commissionRate: z.coerce.number().finite().min(0).max(100).default(10),
  active: z.boolean().default(true),
});

export const employeePatch = employeeInput.partial();

export const inventoryInput = z.object({
  name: requiredText,
  sku: z.string().trim().min(1).max(80),
  stock: nonNegativeInt,
  reorderLevel: nonNegativeInt,
  unitCost: money,
  active: z.boolean().default(true),
});

export const inventoryPatch = inventoryInput.partial();

export const serviceInput = z.object({
  name: requiredText,
  description: optionalText,
  price: money,
  durationMinutes: z.coerce.number().int().min(5).max(1440),
  stockItemId: z.string().trim().optional().nullable(),
  inventoryQuantity: z.coerce.number().int().min(1).default(1),
  active: z.boolean().default(true),
});

export const servicePatch = serviceInput.partial();

const appointmentService = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
});

export const appointmentInput = z.object({
  customer: z.object({ id: z.string().min(1), name: requiredText, phone: z.string().trim().min(5).optional() }),
  stylist: z.object({ id: z.string().min(1), name: z.string().optional() }),
  appointment: z.object({
    appointmentNumber: z.string().trim().max(40).optional(),
    source: z.enum(["Walk-in", "Online", "Phone"]).default("Walk-in"),
  }),
  services: z.array(appointmentService).min(1),
  schedule: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().trim().min(1).max(20),
    duration: z.string().optional(),
  }),
  payment: z.object({
    amount: money.optional(),
    status: z
      .enum(["Paid", "Pending", "Partially Paid", "Refunded"])
      .default("Pending"),
  }),
  status: z
    .enum([
      "Booked",
      "Confirmed",
      "Checked In",
      "In Progress",
      "Completed",
      "Cancelled",
      "No Show",
    ])
    .default("Booked"),
  notes: optionalText,
});

export const invoiceInput = z.object({
  customerId: z.string().min(1),
  appointmentId: z.string().min(1).optional().nullable(),
  amount: money,
  status: z
    .enum(["Paid", "Pending", "Partially Paid", "Refunded"])
    .default("Pending"),
  notes: optionalText,
});

export const invoicePatch = invoiceInput.partial();

export const payrollInput = z.object({
  employeeId: z.string().min(1),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  baseSalary: money.optional(),
  commission: money.optional(),
  deductions: money.default(0),
  status: z.enum(["Draft", "Paid"]).default("Draft"),
});

export const payrollPatch = payrollInput.partial();

export const settingsInput = z.object({
  salonName: requiredText,
  legalName: requiredText,
  gstin: z.string().trim().max(20),
  logoUrl: z.string().trim().max(2000),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().email().max(200),
  website: z.string().trim().max(2000),
  address: z.string().trim().max(500),
  city: z.string().trim().max(100),
  state: z.string().trim().max(100),
  postalCode: z.string().trim().max(20),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  locale: z.string().trim().min(2).max(20),
  timezone: z.string().trim().min(2).max(80),
  taxRate: z.coerce.number().finite().min(0).max(100),
  invoicePrefix: z.string().trim().min(1).max(12),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  appointmentSlotMinutes: z.coerce.number().int().min(5).max(240),
  cancellationWindowHours: z.coerce.number().int().min(0).max(720),
  allowOnlineBooking: z.boolean(),
  adminName: requiredText,
  adminEmail: z.string().trim().email().max(200),
  adminPassword: z.string().min(8).max(200),
  lowStockAlerts: z.boolean(),
  dailyRevenueDigest: z.boolean(),
});

// A salon administrator's password belongs to the User record, not Salon.
// Keep it in the platform-create validator only; ERP settings must be editable
// without sending or attempting to persist a password.
export const settingsUpdateInput = settingsInput.omit({ adminPassword: true });

export const salonCreateInput = settingsInput.extend({
  code: salonCode,
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "ARCHIVED"]).default("TRIAL"),
  subscriptionPlan: z.string().trim().min(1).max(60).default("Starter"),
  trialEndsAt: z.coerce.date().optional().nullable(),
});

export const salonPatchInput = salonCreateInput.partial();
