"use client";

import { useMemo, useState } from "react";
import { BarChart3, Download, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useERPStore } from "@/src/lib/erp-store";

const money = (value: number) => `₹${Math.round(value || 0).toLocaleString("en-IN")}`;
const pad = (value: number) => String(value).padStart(2, "0");
const key = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dayOf = (value: string) => (value ?? "").slice(0, 10);

type Period = "month" | "30d" | "year" | "all";
const periods: { value: Period; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "30d", label: "Last 30 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

function rangeFor(period: Period) {
  const now = new Date();
  if (period === "month") return { from: key(new Date(now.getFullYear(), now.getMonth(), 1)), to: key(now) };
  if (period === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return { from: key(start), to: key(now) };
  }
  if (period === "year") return { from: `${now.getFullYear()}-01-01`, to: key(now) };
  return { from: "0000-01-01", to: "9999-12-31" };
}

const panel = "rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border";

function Stat({ title, value, subtitle, icon: Icon, tone }: { title: string; value: string; subtitle: string; icon: typeof BarChart3; tone?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/5 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className={`mt-0.5 truncate text-2xl font-semibold tracking-tight tabular-nums ${tone ?? "text-foreground"}`}>{value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function ReportsPanel() {
  const { invoices, expenses, payroll, appointments, customers } = useERPStore();
  const [period, setPeriod] = useState<Period>("month");

  const data = useMemo(() => {
    const { from, to } = rangeFor(period);
    const inRange = (day: string) => day >= from && day <= to;
    const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid" && inRange(dayOf(invoice.createdAt)));
    const periodInvoices = invoices.filter((invoice) => inRange(dayOf(invoice.createdAt)));
    const periodExpenses = expenses.filter((expense) => inRange(dayOf(expense.date)));
    const periodPayroll = payroll.filter((run) => run.status === "Paid" && run.month >= from.slice(0, 7) && run.month <= to.slice(0, 7));
    const periodAppointments = appointments.filter((appointment) => inRange(appointment.schedule.date));

    const revenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const expense = periodExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const payrollCost = periodPayroll.reduce((sum, run) => sum + run.baseSalary + run.commission, 0);

    // Monthly buckets (revenue vs expenses) for the chart
    const buckets = new Map<string, { month: string; revenue: number; expenses: number }>();
    const bucket = (day: string) => {
      const month = day.slice(0, 7);
      if (!buckets.has(month)) buckets.set(month, { month, revenue: 0, expenses: 0 });
      return buckets.get(month)!;
    };
    paidInvoices.forEach((invoice) => (bucket(dayOf(invoice.createdAt)).revenue += invoice.amount));
    periodExpenses.forEach((item) => (bucket(dayOf(item.date)).expenses += item.amount || 0));
    const chart = [...buckets.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map((item) => ({
        ...item,
        label: new Date(`${item.month}-01T12:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      }));

    // Top services + stylists from non-cancelled appointments
    const billable = periodAppointments.filter((item) => item.status !== "Cancelled" && item.status !== "No Show");
    const serviceCounts = new Map<string, number>();
    billable.forEach((item) => item.services.forEach((service) => serviceCounts.set(service.name, (serviceCounts.get(service.name) ?? 0) + 1)));
    const topServices = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const stylists = new Map<string, { visits: number; amount: number }>();
    billable
      .filter((item) => item.status === "Completed")
      .forEach((item) => {
        const current = stylists.get(item.stylist.name) ?? { visits: 0, amount: 0 };
        stylists.set(item.stylist.name, { visits: current.visits + 1, amount: current.amount + item.payment.amount });
      });
    const topStylists = [...stylists.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 5);

    return {
      revenue,
      expense,
      payrollCost,
      net: revenue - expense - payrollCost,
      paidCount: paidInvoices.length,
      invoiceCount: periodInvoices.length,
      avgInvoice: periodInvoices.length ? periodInvoices.reduce((sum, invoice) => sum + invoice.amount, 0) / periodInvoices.length : 0,
      paidRate: periodInvoices.length ? Math.round((paidInvoices.length / periodInvoices.length) * 100) : 0,
      bookings: periodAppointments.length,
      completed: periodAppointments.filter((item) => item.status === "Completed").length,
      cancelled: periodAppointments.filter((item) => item.status === "Cancelled" || item.status === "No Show").length,
      walkInShare: periodAppointments.length
        ? Math.round((periodAppointments.filter((item) => item.appointment.source === "Walk-in").length / periodAppointments.length) * 100)
        : 0,
      newCustomers: customers.length,
      chart,
      topServices,
      topStylists,
    };
  }, [appointments, customers.length, expenses, invoices, payroll, period]);

  const exportCsv = () => {
    const label = periods.find((item) => item.value === period)?.label ?? period;
    const lines: (string | number)[][] = [
      ["Report", label],
      ["Gross revenue", data.revenue],
      ["Operating expenses", data.expense],
      ["Paid payroll", data.payrollCost],
      ["Net profit", data.net],
      ["Bookings", data.bookings],
      ["Completed visits", data.completed],
      ["Cancelled / no-show", data.cancelled],
      ["Average invoice", Math.round(data.avgInvoice)],
      ["Paid rate %", data.paidRate],
      [],
      ["Month", "Revenue", "Expenses"],
      ...data.chart.map((item) => [item.month, item.revenue, item.expenses]),
    ];
    const csv = lines.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-${period}-${key(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Report period" className="inline-flex rounded-xl bg-muted p-1">
          {periods.map((item) => (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={period === item.value}
              onClick={() => setPeriod(item.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${period === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground/80 transition hover:bg-muted">
          <Download className="size-4" /> Export CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Gross revenue" value={money(data.revenue)} subtitle={`${data.paidCount} paid invoices`} icon={TrendingUp} />
        <Stat title="Operating expenses" value={money(data.expense)} subtitle="Supplies, rent & misc" icon={TrendingDown} />
        <Stat title="Paid payroll" value={money(data.payrollCost)} subtitle="Staff payouts" icon={Wallet} />
        <Stat title="Net profit" value={money(data.net)} subtitle={data.net >= 0 ? "Profitable" : "Operating deficit"} icon={BarChart3} tone={data.net < 0 ? "text-red-600" : "text-foreground"} />
      </div>

      <section className={panel}>
        <h2 className="text-base font-semibold text-foreground">Revenue vs expenses</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Paid invoices against recorded expenses, by month</p>
        {data.chart.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No revenue or expenses in this period yet.</p>
        ) : (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chart} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v, n) => [money(Number(v)), n === "revenue" ? "Revenue" : "Expenses"]} />
                <Legend formatter={(v) => (v === "revenue" ? "Revenue" : "Expenses")} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--chart-4, #ef4444)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={panel}>
          <h3 className="font-semibold text-foreground">Appointments</h3>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Total bookings", data.bookings],
              ["Completed visits", data.completed],
              ["Cancelled / no-show", data.cancelled],
              ["Walk-in share", `${data.walkInShare}%`],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold tabular-nums text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className={panel}>
          <h3 className="font-semibold text-foreground">Top services</h3>
          {data.topServices.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No bookings in this period.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm">
              {data.topServices.map(([name, count], index) => (
                <li key={name} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">{index + 1}</span>
                    <span className="truncate">{name}</span>
                  </span>
                  <b className="tabular-nums">{count}</b>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className={panel}>
          <h3 className="font-semibold text-foreground">Stylist performance</h3>
          {data.topStylists.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No completed visits in this period.</p>
          ) : (
            <ol className="mt-3 space-y-2 text-sm">
              {data.topStylists.map(([name, stats]) => (
                <li key={name} className="flex items-center justify-between gap-3">
                  <span className="truncate">{name} <span className="text-muted-foreground">· {stats.visits} visits</span></span>
                  <b className="tabular-nums">{money(stats.amount)}</b>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className={panel}>
        <h3 className="font-semibold text-foreground">Billing health</h3>
        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
          <div><p className="text-muted-foreground">Invoices issued</p><p className="text-xl font-semibold tabular-nums">{data.invoiceCount}</p></div>
          <div><p className="text-muted-foreground">Average invoice</p><p className="text-xl font-semibold tabular-nums">{money(data.avgInvoice)}</p></div>
          <div><p className="text-muted-foreground">Paid rate</p><p className="text-xl font-semibold tabular-nums text-emerald-700">{data.paidRate}%</p></div>
        </div>
      </section>
    </div>
  );
}
