"use client";

import {
  ArrowDownToLine,
  ArrowUpRight,
  CalendarCheck2,
  DollarSign,
  IndianRupee,
  ReceiptText,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DashboardHeader from "@/src/components/dashboard/DashboardHeader";
import SummaryCard from "@/src/components/dashboard/SummaryCard";
import QuickActions from "@/src/components/dashboard/QuickActions";
import TodayAppointments from "@/src/components/dashboard/TodayAppointments";
import LoyaltyChecker from "@/src/components/dashboard/LoyaltyChecker";
import RecentCustomers from "@/src/components/dashboard/RecentCustomers";
import { useERPStore, type Invoice } from "@/src/lib/erp-store";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const monthKey = (date: string) => date.slice(0, 7);

function FinancialOverview({
  invoices,
  payroll,
}: {
  invoices: Invoice[];
  payroll: {
    month: string;
    baseSalary: number;
    commission: number;
    status: string;
  }[];
}) {
  const paid = invoices.filter((invoice) => invoice.status === "Paid");
  const outstanding = invoices
    .filter(
      (invoice) =>
        invoice.status === "Pending" || invoice.status === "Partially Paid",
    )
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const collected = paid.reduce((sum, invoice) => sum + invoice.amount, 0);
  const payrollCost = payroll.reduce(
    (sum, run) => sum + run.baseSalary + run.commission,
    0,
  );
  const paidPayroll = payroll
    .filter((run) => run.status === "Paid")
    .reduce((sum, run) => sum + run.baseSalary + run.commission, 0);
  const netCash = collected - paidPayroll;
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const key = monthKey(date.toISOString());
    return {
      key,
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      value: paid
        .filter((invoice) => monthKey(invoice.createdAt) === key)
        .reduce((sum, invoice) => sum + invoice.amount, 0),
    };
  });
  const recent = [...invoices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Financial overview
          </p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">
            Business performance
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">Live from invoices and payroll</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Collected revenue"
          value={money(collected)}
          subtitle={`${paid.length} paid invoices`}
          icon={IndianRupee}
        />
        <SummaryCard
          title="Outstanding"
          value={money(outstanding)}
          subtitle={`${invoices.filter((invoice) => invoice.status === "Pending" || invoice.status === "Partially Paid").length} invoices awaiting`}
          icon={ReceiptText}
        />
        <SummaryCard
          title="Payroll cost"
          value={money(payrollCost)}
          subtitle={`${payroll.length} payroll runs`}
          icon={WalletCards}
        />
        <SummaryCard
          title="Net cash position"
          value={money(netCash)}
          subtitle={`${money(paidPayroll)} payroll paid`}
          icon={TrendingUp}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Revenue trend</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Paid invoice collections over the last six months
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="erpRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={44} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v) => [money(Number(v)), "Collected"]} />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="url(#erpRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cash summary</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Money in versus committed payroll
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
              <span className="flex items-center gap-2 text-sm text-emerald-800">
                <ArrowDownToLine className="h-4 w-4" />
                Collected
              </span>
              <b className="text-emerald-900">{money(collected)}</b>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
              <span className="text-sm text-amber-800">
                Outstanding invoices
              </span>
              <b className="text-amber-900">{money(outstanding)}</b>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/60 p-4">
              <span className="text-sm text-foreground/80">Paid payroll</span>
              <b className="text-foreground">{money(paidPayroll)}</b>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-semibold">Net cash position</span>
              <b className="text-xl">{money(netCash)}</b>
            </div>
          </div>
        </section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <h3 className="text-lg font-semibold">Recent financial activity</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest invoices and payment status
          </p>
        </div>
        {recent.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No financial activity yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted/60">
                    <ReceiptText className="h-5 w-5 text-foreground/80" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {invoice.invoiceNumber ?? "Invoice"}
                    </p>
                    <p className="text-xs text-muted-foreground">{invoice.createdAt}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{money(invoice.amount)}</p>
                  <span className="text-xs font-medium text-muted-foreground">
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default function DashboardPage() {
  const { appointments, invoices, payroll, customers } = useERPStore();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayAppointments = appointments.filter(
    (item) => item.schedule.date === today,
  );
  const completed = todayAppointments.filter(
    (item) => item.status === "Completed",
  ).length;
  const todayCustomerIds = new Set(
    todayAppointments.map((item) => item.customer.id),
  );
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Today's Revenue"
          value={money(
            invoices
              .filter(
                (invoice) =>
                  invoice.status === "Paid" && invoice.createdAt === today,
              )
              .reduce((sum, invoice) => sum + invoice.amount, 0),
          )}
          subtitle="Collected today"
          icon={IndianRupee}
        />
        <SummaryCard
          title="Completed Appointments"
          value={`${completed} / ${todayAppointments.length}`}
          subtitle={`${todayAppointments.length - completed} appointments remaining`}
          icon={CalendarCheck2}
        />
        <SummaryCard
          title="Customers Today"
          value={String(todayCustomerIds.size)}
          subtitle={`${customers.length} total customers`}
          icon={Users}
        />
        <SummaryCard
          title="Total Invoices"
          value={String(invoices.length)}
          subtitle={`${invoices.filter((invoice) => invoice.status === "Paid").length} paid`}
          icon={ReceiptText}
        />
      </div>
      <FinancialOverview invoices={invoices} payroll={payroll} />
      <QuickActions />
      <TodayAppointments />
      <div className="grid gap-6 xl:grid-cols-2">
        <LoyaltyChecker />
        <RecentCustomers />
      </div>
    </div>
  );
}
