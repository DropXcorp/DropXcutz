import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";
import { getEffectiveFeatures } from "./feature.service";

const membershipToDb = {
  Standard: "STANDARD",
  Silver: "SILVER",
  Gold: "GOLD",
} as const;

const membershipToUi = {
  STANDARD: "Standard",
  SILVER: "Silver",
  GOLD: "Gold",
} as const;
const sourceToDb = {
  ERP: "ERP",
  "Walk-in": "WALK_IN",
  Online: "WEBSITE",
  Phone: "PHONE",
  WhatsApp: "WHATSAPP",
} as const;
const sourceToUi = {
  ERP: "ERP",
  WALK_IN: "Walk-in",
  WEBSITE: "Online",
  PHONE: "Phone",
  WHATSAPP: "WhatsApp",
} as const;
const appointmentStatusToDb = {
  Booked: "BOOKED",
  Confirmed: "CONFIRMED",
  "Checked In": "CHECKED_IN",
  "In Progress": "IN_PROGRESS",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
  "No Show": "NO_SHOW",
} as const;
const appointmentStatusToUi = {
  BOOKED: "Booked",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
} as const;
const paymentStatusToDb = {
  Pending: "PENDING",
  "Partially Paid": "PARTIALLY_PAID",
  Paid: "PAID",
  Refunded: "REFUNDED",
} as const;
const paymentStatusToUi = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  REFUNDED: "Refunded",
} as const;
const payrollStatusToDb = { Draft: "DRAFT", Paid: "PAID" } as const;
const payrollStatusToUi = { DRAFT: "Draft", PAID: "Paid" } as const;

export type CustomerInput = {
  name: string;
  phone: string;
  email?: string | null;
  membership?: keyof typeof membershipToDb;
  points?: number;
  totalSpend?: number;
  notes?: string | null;
};
export type EmployeeInput = {
  name: string;
  role: string;
  phone: string;
  email?: string | null;
  baseSalary: number;
  commissionRate?: number;
  active?: boolean;
  isBookable?: boolean;
};
export type InventoryInput = {
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  unitCost: number;
  active?: boolean;
};
export type ServiceInput = {
  name: string;
  description?: string | null;
  price: number;
  durationMinutes: number;
  stockItemId?: string | null;
  inventoryQuantity?: number;
  active?: boolean;
  isPublic?: boolean;
};

export const toNumber = (value: { toString(): string } | number) =>
  Number(value);

export function customerData(input: Partial<CustomerInput>) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.phone !== undefined && { phone: input.phone }),
    ...(input.email !== undefined && { email: input.email || null }),
    ...(input.membership !== undefined && {
      membership: membershipToDb[input.membership],
    }),
    ...(input.points !== undefined && { points: input.points }),
    ...(input.totalSpend !== undefined && { totalSpend: input.totalSpend }),
    ...(input.notes !== undefined && { notes: input.notes || null }),
  };
}

export function employeeData(input: Partial<EmployeeInput>) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.role !== undefined && { role: input.role }),
    ...(input.phone !== undefined && { phone: input.phone }),
    ...(input.email !== undefined && { email: input.email || null }),
    ...(input.baseSalary !== undefined && { baseSalary: input.baseSalary }),
    ...(input.commissionRate !== undefined && {
      commissionRate: input.commissionRate,
    }),
    ...(input.active !== undefined && { active: input.active }),
    ...(input.isBookable !== undefined && { isBookable: input.isBookable }),
  };
}

export function inventoryData(input: Partial<InventoryInput>) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.sku !== undefined && { sku: input.sku }),
    ...(input.stock !== undefined && { stock: input.stock }),
    ...(input.reorderLevel !== undefined && {
      reorderLevel: input.reorderLevel,
    }),
    ...(input.unitCost !== undefined && { unitCost: input.unitCost }),
    ...(input.active !== undefined && { active: input.active }),
  };
}

export function serviceData(input: Partial<ServiceInput>) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && {
      description: input.description || null,
    }),
    ...(input.price !== undefined && { price: input.price }),
    ...(input.durationMinutes !== undefined && {
      durationMinutes: input.durationMinutes,
    }),
    ...(input.stockItemId !== undefined && {
      inventoryItemId: input.stockItemId || null,
    }),
    ...(input.inventoryQuantity !== undefined && {
      inventoryQuantity: input.inventoryQuantity,
    }),
    ...(input.active !== undefined && { active: input.active }),
    ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
  };
}

export function settingsDto(salon: any) {
  return {
    salonName: salon.salonName,
    legalName: salon.legalName,
    gstin: salon.gstin ?? "",
    logoUrl: salon.logoUrl ?? "",
    phone: salon.phone,
    email: salon.email,
    website: salon.website ?? "",
    address: salon.address ?? "",
    city: salon.city ?? "",
    state: salon.state ?? "",
    postalCode: salon.postalCode ?? "",
    currency: salon.currency,
    locale: salon.locale,
    timezone: salon.timezone,
    taxRate: toNumber(salon.taxRate),
    invoicePrefix: salon.invoicePrefix,
    openingTime: salon.openingTime,
    closingTime: salon.closingTime,
    appointmentSlotMinutes: salon.appointmentSlotMinutes,
    cancellationWindowHours: salon.cancellationWindowHours,
    allowOnlineBooking: salon.allowOnlineBooking,
    adminName: salon.adminName,
    adminEmail: salon.adminEmail,
    lowStockAlerts: salon.lowStockAlerts,
    dailyRevenueDigest: salon.dailyRevenueDigest,
  };
}

export const customerDto = (customer: any) => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  membership:
    membershipToUi[customer.membership as keyof typeof membershipToUi],
  points: customer.points,
  totalSpend: toNumber(customer.totalSpend),
});

/** Keep the denormalized customer spend in sync with paid invoices. */
export async function refreshCustomerSpend(client: any, customerId: string) {
  const paid = await client.invoice.aggregate({
    where: { customerId, status: "PAID" },
    _sum: { totalAmount: true },
  });
  await client.customer.update({
    where: { id: customerId },
    data: { totalSpend: paid._sum.totalAmount ?? 0 },
  });
}
export const employeeDto = (employee: any) => ({
  id: employee.id,
  name: employee.name,
  role: employee.role,
  phone: employee.phone,
  baseSalary: toNumber(employee.baseSalary),
  active: employee.active,
  isBookable: employee.isBookable,
});
export const inventoryDto = (item: any) => ({
  id: item.id,
  name: item.name,
  sku: item.sku,
  stock: item.stock,
  reorderLevel: item.reorderLevel,
  unitCost: toNumber(item.unitCost),
});
export const serviceDto = (service: any) => ({
  id: service.id,
  name: service.name,
  price: toNumber(service.price),
  durationMinutes: service.durationMinutes,
  isPublic: service.isPublic,
  ...(service.inventoryItemId && { stockItemId: service.inventoryItemId }),
});
const datePart = (date: Date) => date.toISOString().slice(0, 10);
const timePart = (date: Date) =>
  date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

export const appointmentDto = (item: any) => ({
  id: item.id,
  customer: {
    id: item.customer.id,
    name: item.customer.name,
    phone: item.customer.phone ?? "",
    membership:
      membershipToUi[item.customer.membership as keyof typeof membershipToUi],
  },
  appointment: {
    appointmentNumber: item.appointmentNumber,
    source: sourceToUi[item.source as keyof typeof sourceToUi],
  },
  services: item.lines.map((line: any) => ({
    id: line.serviceId ?? line.id,
    name: line.serviceName,
  })),
  stylist: item.employee
    ? {
        id: item.employee.id,
        name: item.employee.name,
        designation: item.employee.role,
      }
    : { id: "unassigned", name: "Unassigned", designation: "" },
  schedule: {
    date: datePart(item.scheduledAt),
    time: timePart(item.scheduledAt),
    duration: `${item.durationMinutes} mins`,
  },
  payment: {
    amount: toNumber(item.totalAmount),
    status:
      paymentStatusToUi[item.paymentStatus as keyof typeof paymentStatusToUi],
  },
  status:
    appointmentStatusToUi[item.status as keyof typeof appointmentStatusToUi],
  notes: item.notes ?? undefined,
});

export const invoiceDto = (invoice: any) => ({
  id: invoice.id,
  invoiceNumber: invoice.invoiceNumber,
  customerId: invoice.customerId,
  appointmentId: invoice.appointmentId ?? undefined,
  amount: toNumber(invoice.totalAmount),
  status: paymentStatusToUi[invoice.status as keyof typeof paymentStatusToUi],
  createdAt: datePart(invoice.issuedAt),
});
export const payrollDto = (run: any) => ({
  id: run.id,
  employeeId: run.employeeId,
  month: run.month,
  baseSalary: toNumber(run.baseSalary),
  commission: toNumber(run.commission),
  status: payrollStatusToUi[run.status as keyof typeof payrollStatusToUi],
});

export async function requireSalon(code: string) {
  const salon = await prisma.salon.findUnique({ where: { code } });
  if (!salon || salon.status === "ARCHIVED")
    throw new ApiError(404, "Salon not found.");
  if (salon.status === "SUSPENDED")
    throw new ApiError(403, "This salon account is suspended.");
  return salon;
}

export async function assertOwned(
  model:
    | "customer"
    | "employee"
    | "inventoryItem"
    | "service"
    | "appointment"
    | "invoice"
    | "payrollRun",
  id: string,
  salonId: string,
) {
  const record = await (prisma[model] as any).findFirst({
    where: { id, salonId },
    select: { id: true },
  });
  if (!record) throw new ApiError(404, "Record not found for this salon.");
}

export async function getSnapshot(salonId: string) {
  const [
    salon,
    customers,
    employees,
    services,
    inventory,
    appointments,
    invoices,
    payroll,
    notifications,
    subscription,
    effectiveFeatures,
    website,
  ] = await Promise.all([
    prisma.salon.findUniqueOrThrow({ where: { id: salonId } }),
    prisma.customer.findMany({
      where: { salonId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.findMany({
      where: { salonId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.service.findMany({
      where: { salonId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.inventoryItem.findMany({
      where: { salonId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.appointment.findMany({
      where: { salonId },
      include: {
        customer: true,
        employee: true,
        lines: { orderBy: { id: "asc" } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 500,
    }),
    prisma.invoice.findMany({
      where: { salonId },
      orderBy: { issuedAt: "desc" },
      take: 500,
    }),
    prisma.payrollRun.findMany({
      where: { salonId },
      orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    }),
    prisma.notification.findMany({
      where: { salonId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.subscription.findFirst({ where: { salonId }, orderBy: { createdAt: "desc" }, include: { plan: true } }),
    getEffectiveFeatures(salonId),
    prisma.salonWebsiteSettings.findUnique({ where: { salonId } }),
  ]);
  const enabledFeatures = new Set(
    effectiveFeatures.filter((feature) => feature.enabled).map((feature) => feature.code),
  );
  return {
    salon: {
      id: salon.id,
      code: salon.code,
      status: salon.status,
      subscriptionPlan: salon.subscriptionPlan,
    },
    subscription: subscription ? { plan: subscription.plan.name, status: subscription.status, expiresAt: subscription.expiresAt?.toISOString() ?? null } : null,
    features: [...enabledFeatures],
    website: website ? { type: website.type } : null,
    settings: settingsDto(salon),
    customers: enabledFeatures.has("CUSTOMERS") ? customers.map(customerDto) : [],
    employees: enabledFeatures.has("EMPLOYEES") ? employees.map(employeeDto) : [],
    services: enabledFeatures.has("SERVICES") ? services.map(serviceDto) : [],
    inventory: enabledFeatures.has("INVENTORY") ? inventory.map(inventoryDto) : [],
    appointments: enabledFeatures.has("APPOINTMENTS") ? appointments.map(appointmentDto) : [],
    invoices: enabledFeatures.has("INVOICES") ? invoices.map(invoiceDto) : [],
    payroll: enabledFeatures.has("PAYROLL") ? payroll.map(payrollDto) : [],
    notifications,
  };
}

function parseWallTime(date: string, time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) throw new ApiError(400, "Appointment time is invalid.");
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (minute > 59 || hour > (period ? 12 : 23) || hour < (period ? 1 : 0))
    throw new ApiError(400, "Appointment time is invalid.");
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return new Date(
    `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`,
  );
}

async function nextAppointmentNumber(client: any, salonId: string) {
  const salon = await client.salon.update({
    where: { id: salonId },
    data: { nextAppointmentNumber: { increment: 1 } },
    select: { nextAppointmentNumber: true },
  });
  return `APT-${salon.nextAppointmentNumber - 1}`;
}
async function nextInvoiceNumber(client: any, salonId: string) {
  const salon = await client.salon.update({
    where: { id: salonId },
    data: { nextInvoiceNumber: { increment: 1 } },
    select: { nextInvoiceNumber: true, invoicePrefix: true },
  });
  return `${salon.invoicePrefix}-${String(salon.nextInvoiceNumber - 1).padStart(5, "0")}`;
}

export async function saveAppointment(
  salonId: string,
  id: string | null,
  input: any,
) {
  await assertOwned("customer", input.customer.id, salonId);
  if (input.stylist.id !== "unassigned")
    await assertOwned("employee", input.stylist.id, salonId);
  const serviceIds = input.services.map(
    (service: { id: string }) => service.id,
  );
  const services = await prisma.service.findMany({
    where: { salonId, id: { in: serviceIds }, active: true },
  });
  if (services.length !== new Set(serviceIds).size)
    throw new ApiError(400, "One or more selected services are unavailable.");
  const subtotal = services.reduce(
    (sum, service) => sum + toNumber(service.price),
    0,
  );
  const durationMinutes = services.reduce(
    (sum, service) => sum + service.durationMinutes,
    0,
  );
  const scheduledAt = parseWallTime(input.schedule.date, input.schedule.time);
  const lines = services.map((service) => ({
    serviceId: service.id,
    serviceName: service.name,
    unitPrice: service.price,
    durationMinutes: service.durationMinutes,
  }));
  const saved = await prisma.$transaction(async (client) => {
    await client.customer.update({
      where: { id: input.customer.id },
      data: {
        name: input.customer.name,
        ...(input.customer.phone ? { phone: input.customer.phone } : {}),
      },
    });
    const data = {
      customerId: input.customer.id,
      employeeId: input.stylist.id === "unassigned" ? null : input.stylist.id,
      source: sourceToDb[input.appointment.source as keyof typeof sourceToDb],
      scheduledAt,
      durationMinutes,
      subtotal,
      taxAmount: 0,
      totalAmount: subtotal,
      amountPaid: input.payment.status === "Paid" ? subtotal : 0,
      paymentStatus:
        paymentStatusToDb[
          input.payment.status as keyof typeof paymentStatusToDb
        ],
      status:
        appointmentStatusToDb[
          input.status as keyof typeof appointmentStatusToDb
        ],
      notes: input.notes || null,
    };
    if (id) {
      const existing = await client.appointment.findFirst({
        where: { id, salonId },
        select: { id: true },
      });
      if (!existing) throw new ApiError(404, "Appointment not found.");
      await client.appointmentLine.deleteMany({ where: { appointmentId: id } });
      return client.appointment.update({
        where: { id },
        data: { ...data, lines: { create: lines } },
        include: { customer: true, employee: true, lines: true },
      });
    }
    return client.appointment.create({
      data: {
        ...data,
        salonId,
        appointmentNumber: await nextAppointmentNumber(client, salonId),
        lines: { create: lines },
      },
      include: { customer: true, employee: true, lines: true },
    });
  });
  return appointmentDto(saved);
}

export async function createInvoice(salonId: string, input: any) {
  await assertOwned("customer", input.customerId, salonId);
  if (input.appointmentId)
    await assertOwned("appointment", input.appointmentId, salonId);
  const invoice = await prisma.$transaction(async (client) => {
    const created = await client.invoice.create({
      data: {
        salonId,
        invoiceNumber: await nextInvoiceNumber(client, salonId),
        customerId: input.customerId,
        appointmentId: input.appointmentId || null,
        subtotal: input.amount,
        taxAmount: 0,
        totalAmount: input.amount,
        amountPaid: input.status === "Paid" ? input.amount : 0,
        status:
          paymentStatusToDb[input.status as keyof typeof paymentStatusToDb],
        notes: input.notes || null,
      },
    });
    if (input.appointmentId) {
      await client.appointment.update({
        where: { id: input.appointmentId },
        data: {
          amountPaid: input.status === "Paid" ? input.amount : 0,
          paymentStatus:
            paymentStatusToDb[input.status as keyof typeof paymentStatusToDb],
        },
      });
    }
    if (input.status === "Paid")
      await refreshCustomerSpend(client, input.customerId);
    return created;
  });
  return invoiceDto(invoice);
}

export async function createPayroll(salonId: string, input: any) {
  await assertOwned("employee", input.employeeId, salonId);
  const employee = await prisma.employee.findFirstOrThrow({
    where: { id: input.employeeId, salonId },
  });
  const monthStart = new Date(`${input.month}-01T00:00:00.000Z`);
  const monthEnd = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
  );
  const completed = await prisma.appointment.aggregate({
    where: {
      salonId,
      employeeId: employee.id,
      status: "COMPLETED",
      scheduledAt: { gte: monthStart, lt: monthEnd },
    },
    _sum: { totalAmount: true },
  });
  const calculatedCommission =
    (toNumber(completed._sum.totalAmount ?? 0) *
      toNumber(employee.commissionRate)) /
    100;
  const run = await prisma.payrollRun.create({
    data: {
      salonId,
      employeeId: employee.id,
      month: input.month,
      baseSalary: input.baseSalary ?? employee.baseSalary,
      commission: input.commission ?? calculatedCommission,
      deductions: input.deductions,
      status: payrollStatusToDb[input.status as keyof typeof payrollStatusToDb],
      paidAt: input.status === "Paid" ? new Date() : null,
    },
  });
  return payrollDto(run);
}
