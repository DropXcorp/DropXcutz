"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { useERPStore } from "@/src/lib/erp-store";

const statusColors: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Booked: "bg-amber-100 text-amber-700",
  Confirmed: "bg-violet-100 text-violet-700",
  Cancelled: "bg-red-100 text-red-700",
};
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function TodayAppointments() {
  const appointments = useERPStore((state) => state.appointments);
  const today = new Date().toISOString().slice(0, 10);
  const items = appointments
    .filter((item) => item.schedule.date === today)
    .sort((a, b) => a.schedule.time.localeCompare(b.schedule.time));
  return (
    <section className="flex max-h-[560px] min-h-80 flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 p-5">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-zinc-600" />
          <h2 className="text-lg font-semibold text-zinc-900">
            Today&apos;s Appointments
          </h2>
        </div>
        <Link
          href="/appointments"
          className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-black"
        >
          View All
          <ChevronRight size={16} />
        </Link>
      </div>
      <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto">
        {items.length === 0 && (
          <p className="p-10 text-center text-sm text-zinc-500">
            No appointments booked for today.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-5 transition hover:bg-zinc-50"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                {item.customer.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-zinc-900">
                  {item.customer.name}
                </h3>
                <p className="truncate text-sm text-zinc-500">
                  {item.services.map((service) => service.name).join(", ")}
                </p>
                <p className="text-xs text-zinc-400">
                  Stylist: {item.stylist.name}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold">{item.schedule.time}</p>
              <p className="text-sm text-zinc-500">
                {money(item.payment.amount)}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[item.status] ?? "bg-zinc-100 text-zinc-700"}`}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
