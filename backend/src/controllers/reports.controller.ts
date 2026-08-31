import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/error.middleware";

const reportQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  compareFrom: z.coerce.date().optional(),
  compareTo: z.coerce.date().optional(),
});
type Range = { from: Date; to: Date };
const decimal = (value: unknown) => Number(value ?? 0);

function resolveRange(input: z.infer<typeof reportQuery>): Range {
  const to = input.to ?? new Date();
  const from = input.from ?? new Date(to.getFullYear(), to.getMonth(), 1);
  if (from > to) throw new ApiError(400, "The report start date must be before the end date.");
  return { from, to: new Date(to.getTime() + 24 * 60 * 60 * 1_000) };
}

async function snapshot(range: Range) {
  const invoiceWhere = { issuedAt: { gte: range.from, lt: range.to } };
  const expenseWhere = { date: { gte: range.from, lt: range.to } };
  const payrollWhere = { status: "PAID" as const, paidAt: { gte: range.from, lt: range.to } };
  const [paid, refunded, expenses, payroll, platformPaid, invoices, salonNames] = await Promise.all([
    prisma.invoice.aggregate({ where: { ...invoiceWhere, status: "PAID" }, _sum: { totalAmount: true, taxAmount: true, amountPaid: true }, _count: true }),
    prisma.invoice.aggregate({ where: { ...invoiceWhere, status: "REFUNDED" }, _sum: { totalAmount: true, amountPaid: true }, _count: true }),
    prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
    prisma.payrollRun.findMany({ where: payrollWhere, select: { baseSalary: true, commission: true, deductions: true } }),
    prisma.platformInvoice.aggregate({ where: { createdAt: { gte: range.from, lt: range.to }, status: "PAID" }, _sum: { totalAmount: true, taxAmount: true }, _count: true }),
    prisma.invoice.findMany({ where: invoiceWhere, select: { salonId: true, issuedAt: true, totalAmount: true, status: true }, orderBy: { issuedAt: "asc" }, take: 10_000 }),
    prisma.salon.findMany({ select: { id: true, salonName: true, code: true } }),
  ]);
  const payouts = payroll.reduce((sum, item) => sum + decimal(item.baseSalary) + decimal(item.commission) - decimal(item.deductions), 0);
  const revenue = decimal(paid._sum.totalAmount);
  const gst = decimal(paid._sum.taxAmount);
  const refunds = decimal(refunded._sum.amountPaid || refunded._sum.totalAmount);
  const costs = decimal(expenses._sum.amount) + payouts;
  const daily = new Map<string, { revenue: number; refunds: number }>();
  const salons = new Map<string, { revenue: number; refunds: number }>();
  for (const invoice of invoices) {
    const day = invoice.issuedAt.toISOString().slice(0, 10);
    const row = daily.get(day) ?? { revenue: 0, refunds: 0 };
    const salon = salons.get(invoice.salonId) ?? { revenue: 0, refunds: 0 };
    if (invoice.status === "PAID") { row.revenue += decimal(invoice.totalAmount); salon.revenue += decimal(invoice.totalAmount); }
    if (invoice.status === "REFUNDED") { row.refunds += decimal(invoice.totalAmount); salon.refunds += decimal(invoice.totalAmount); }
    daily.set(day, row); salons.set(invoice.salonId, salon);
  }
  const nameMap = new Map(salonNames.map((salon) => [salon.id, salon]));
  return {
    metrics: { revenue, gst, refunds, expenses: decimal(expenses._sum.amount), payouts, profitLoss: revenue - refunds - costs, paidInvoiceCount: paid._count, refundedInvoiceCount: refunded._count, platformBillingRevenue: decimal(platformPaid._sum.totalAmount), platformBillingGst: decimal(platformPaid._sum.taxAmount), platformBillingInvoiceCount: platformPaid._count },
    daily: [...daily.entries()].map(([date, values]) => ({ date, ...values })),
    salons: [...salons.entries()].map(([salonId, values]) => ({ salonId, salonName: nameMap.get(salonId)?.salonName ?? "Deleted salon", code: nameMap.get(salonId)?.code ?? "—", ...values })).sort((a, b) => b.revenue - a.revenue),
  };
}

export async function financialReport(request: Request, response: Response) {
  const input = reportQuery.parse(request.query);
  const currentRange = resolveRange(input);
  const current = await snapshot(currentRange);
  const comparison = input.compareFrom || input.compareTo ? await snapshot(resolveRange({ from: input.compareFrom, to: input.compareTo })) : null;
  response.json({ data: { range: { from: currentRange.from, to: new Date(currentRange.to.getTime() - 1) }, current, comparison } });
}

export async function financialReportCsv(request: Request, response: Response) {
  const input = reportQuery.parse(request.query);
  const range = resolveRange(input);
  const report = await snapshot(range);
  const rows = [
    ["Metric", "Amount"],
    ...Object.entries(report.metrics).map(([key, value]) => [key, String(value)]),
    [],
    ["Date", "Revenue", "Refunds"],
    ...report.daily.map((row) => [row.date, String(row.revenue), String(row.refunds)]),
    [],
    ["Salon", "Code", "Revenue", "Refunds"],
    ...report.salons.map((row) => [row.salonName, row.code, String(row.revenue), String(row.refunds)]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
  response.setHeader("content-type", "text/csv; charset=utf-8");
  response.setHeader("content-disposition", `attachment; filename="dropxcutz-financial-${range.from.toISOString().slice(0, 10)}.csv"`);
  response.send(csv);
}
