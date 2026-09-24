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
  "Checked In": "bg-cyan-100 text-cyan-700",
  "No Show": "bg-muted text-foreground/70",
};
const minutesOf = (time: string) => {
  const match = time.trim().match(/^(d{1,2}):(d{2})s*([AP]M)?$/i);
  if (!match) return 0;
  let hour = Number(match[1]);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + Number(match[2]);
};
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function TodayAppointments() {
  const appointments = useERPStore((state) => state.appointments);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const items = appointments
    .filter((item) => item.schedule.date === today)
    .sort((a, b) => minutesOf(a.schedule.time) - minutesOf(b.schedule.time));
  return (
    <section className="flex max-h-[560px] min-h-80 flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-foreground/70" />
          <h2 className="text-lg font-semibold text-foreground">
            Today&apos;s Appointments
          </h2>
        </div>
        <Link
          href="/appointments"
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          View All
          <ChevronRight size={16} />
        </Link>
      </div>
      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {items.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No appointments booked for today.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 p-5 transition hover:bg-muted/60"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {item.customer.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-foreground">
                  {item.customer.name}
                </h3>
                <p className="truncate text-sm text-muted-foreground">
                  {item.services.map((service) => service.name).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Stylist: {item.stylist.name}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold">{item.schedule.time}</p>
              <p className="text-sm text-muted-foreground">
                {money(item.payment.amount)}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[item.status] ?? "bg-muted/60 text-foreground/80"}`}
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
