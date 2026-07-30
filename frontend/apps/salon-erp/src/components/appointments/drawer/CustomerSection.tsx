"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  User,
  Phone,
  Crown,
  Wallet,
  Clock3,
  ChevronRight,
} from "lucide-react";

export default function CustomerSection() {
  const [selectedCustomer] = useState({
    id: "1",
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
    membership: "Gold Member",
    visits: 18,
    wallet: 520,
  });

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">

      {/* Header */}

      <div className="border-b border-zinc-200 px-5 py-4">

        <h3 className="text-lg font-semibold text-zinc-900">
          Customer
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Select an existing customer or create a new one.
        </p>

      </div>

      <div className="space-y-5 p-5">

        {/* Search */}

        <div className="relative">

          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />

          <input
            placeholder="Search by customer name or phone..."
            className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-sm outline-none transition focus:border-black focus:bg-white"
          />

        </div>

        {/* Action */}

        <button className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">

          <Plus className="h-4 w-4" />

          Add New Customer

        </button>

        {/* Selected Customer */}

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">

          <div className="flex items-start justify-between">

            <div className="flex gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">

                <User className="h-6 w-6" />

              </div>

              <div>

                <h4 className="text-lg font-semibold text-zinc-900">
                  {selectedCustomer.name}
                </h4>

                <div className="mt-2 flex flex-wrap gap-2">

                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">

                    <Crown className="h-3 w-3" />

                    {selectedCustomer.membership}

                  </span>

                </div>

              </div>

            </div>

            <button className="rounded-lg p-2 transition hover:bg-white">

              <ChevronRight className="h-5 w-5 text-zinc-500" />

            </button>

          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">

            <InfoCard
              icon={Phone}
              label="Phone"
              value={selectedCustomer.phone}
            />

            <InfoCard
              icon={Clock3}
              label="Visits"
              value={selectedCustomer.visits}
            />

            <InfoCard
              icon={Wallet}
              label="Wallet"
              value={`₹${selectedCustomer.wallet}`}
            />

          </div>

        </div>

      </div>

    </section>
  );
}

interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: InfoCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">

      <div className="flex items-center gap-2 text-zinc-500">

        <Icon className="h-4 w-4" />

        <span className="text-xs uppercase tracking-wide">
          {label}
        </span>

      </div>

      <p className="mt-2 font-semibold text-zinc-900">
        {value}
      </p>

    </div>
  );
}