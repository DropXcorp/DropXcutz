"use client";

import { CalendarCheck2, DollarSign, IndianRupee, Users } from "lucide-react";
import DashboardHeader from "@/src/components/dashboard/DashboardHeader";
import SummaryCard from "@/src/components/dashboard/SummaryCard";
import QuickActions from "@/src/components/dashboard/QuickActions";
import TodayAppointments from "@/src/components/dashboard/TodayAppointments";
import LoyaltyChecker from "@/src/components/dashboard/LoyaltyChecker";
import RecentCustomers from "@/src/components/dashboard/RecentCustomers";
import { useERPStore } from "@/src/lib/erp-store";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function DashboardPage() {
  const { appointments, invoices, customers } = useERPStore();
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const todayAppointments = appointments.filter((item) => item.schedule.date === today);
  const paidInvoices = invoices.filter((item) => item.status === "Paid");
  const monthlyRevenue = paidInvoices.filter((item) => item.createdAt.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
  const todayRevenue = paidInvoices.filter((item) => item.createdAt === today).reduce((sum, item) => sum + item.amount, 0);
  const completed = todayAppointments.filter((item) => item.status === "Completed").length;
  const todayCustomerIds = new Set(todayAppointments.map((item) => item.customer.id));
  return <div className="space-y-6">
    <DashboardHeader />
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard title="Monthly Revenue" value={money(monthlyRevenue)} subtitle={`${paidInvoices.filter((item) => item.createdAt.startsWith(month)).length} paid invoices`} icon={IndianRupee} />
      <SummaryCard title="Today's Revenue" value={money(todayRevenue)} subtitle={`${paidInvoices.filter((item) => item.createdAt === today).length} payments received`} icon={DollarSign} />
      <SummaryCard title="Completed Appointments" value={`${completed} / ${todayAppointments.length}`} subtitle={`${todayAppointments.length - completed} appointments remaining`} icon={CalendarCheck2} />
      <SummaryCard title="Customers Today" value={String(todayCustomerIds.size)} subtitle={`${customers.length} total customers`} icon={Users} />
    </div>
    <QuickActions />
    <TodayAppointments />
    <div className="grid gap-6 xl:grid-cols-2"><LoyaltyChecker /><RecentCustomers /></div>
  </div>;
}
