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
    <section className="flex h-[560px] flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 p-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Recent Customers
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Latest customer profiles and visits
          </p>
        </div>
        <Link
          href="/customers"
          className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-black"
        >
          View All
          <ChevronRight size={16} />
        </Link>
      </div>
      <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto">
        {customers.slice(0, 8).map((customer) => {
          const visit = appointments.find(
            (item) => item.customer.id === customer.id,
          );
          return (
            <div
              key={customer.id}
              className="flex items-center justify-between gap-4 p-5 transition hover:bg-zinc-50"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-semibold text-white">
                  {customer.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-zinc-900">
                    {customer.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                    <Phone size={14} />
                    {customer.phone}
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-400">
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
