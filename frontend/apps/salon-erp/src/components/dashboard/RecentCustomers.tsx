"use client";

import Link from "next/link";
import { ChevronRight, Phone } from "lucide-react";
import { useERPStore } from "@/src/lib/erp-store";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function RecentCustomers() {
  const { customers, appointments } = useERPStore();
  return (
    <section className="flex h-[560px] flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Recent Customers
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest customer profiles and visits
          </p>
        </div>
        <Link
          href="/customers"
          className="flex items-center gap-1 text-sm font-medium text-foreground/70 hover:text-foreground"
        >
          View All
          <ChevronRight size={16} />
        </Link>
      </div>
      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {customers.slice(0, 8).map((customer) => {
          const visit = appointments.find(
            (item) => item.customer.id === customer.id,
          );
          return (
            <div
              key={customer.id}
              className="flex items-center justify-between gap-4 p-5 transition hover:bg-muted/60"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white">
                  {customer.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">
                    {customer.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} />
                    {customer.phone}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {visit
                      ? `Last booking: ${visit.services.map((item) => item.name).join(", ")}`
                      : "No appointments yet"}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold">{money(customer.totalSpend)}</p>
                <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  {customer.membership}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
