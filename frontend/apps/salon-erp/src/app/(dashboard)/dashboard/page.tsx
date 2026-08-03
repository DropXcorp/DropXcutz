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
  const maxMonth = Math.max(...months.map((month) => month.value), 1);
  const recent = [...invoices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            Financial overview
          </p>
          <h2 className="mt-1 text-2xl font-bold text-zinc-950">
            Business performance
          </h2>
        </div>
        <p className="text-sm text-zinc-500">Live from invoices and payroll</p>
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
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Revenue trend</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Paid invoice collections over the last six months
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-8 flex h-48 items-end gap-3 sm:gap-5">
            {months.map((month) => (
              <div
                key={month.key}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-semibold text-zinc-600">
                  {month.value ? money(month.value) : "₹0"}
                </span>
                <div className="flex h-32 w-full items-end rounded-lg bg-zinc-100">
                  <div
                    className="w-full rounded-lg bg-zinc-900 transition-all"
                    style={{
                      height: `${Math.max((month.value / maxMonth) * 100, month.value ? 8 : 2)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-zinc-500">
                  {month.label}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cash summary</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Money in versus committed payroll
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-zinc-500" />
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
            <div className="flex items-center justify-between rounded-xl bg-zinc-100 p-4">
              <span className="text-sm text-zinc-700">Paid payroll</span>
              <b className="text-zinc-900">{money(paidPayroll)}</b>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
              <span className="font-semibold">Net cash position</span>
              <b className="text-xl">{money(netCash)}</b>
            </div>
          </div>
        </section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 p-5">
          <h3 className="text-lg font-semibold">Recent financial activity</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Latest invoices and payment status
          </p>
        </div>
        {recent.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">
            No financial activity yet.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recent.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100">
                    <ReceiptText className="h-5 w-5 text-zinc-700" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {invoice.invoiceNumber ?? "Invoice"}
                    </p>
                    <p className="text-xs text-zinc-500">{invoice.createdAt}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{money(invoice.amount)}</p>
                  <span className="text-xs font-medium text-zinc-500">
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
  const today = new Date().toISOString().slice(0, 10);
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
