"use client";

import {
  CalendarPlus,
  UserPlus,
  Receipt,
  Gift,
  Scissors,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

const actions = [
  {
    title: "New Appointment",
    description: "Book a customer",
    icon: CalendarPlus,
    href: "/appointments",
  },
  {
    title: "Walk-in Customer",
    description: "Quick check-in",
    icon: UserRound,
    href: "/appointments",
  },
  {
    title: "Add Customer",
    description: "Create profile",
    icon: UserPlus,
    href: "/customers",
  },
  {
    title: "Generate Invoice",
    description: "Create bill",
    icon: Receipt,
    href: "/billing",
  },
  {
    title: "Check Loyalty",
    description: "Redeem points",
    icon: Gift,
    href: "/loyalty",
  },
  {
    title: "Add Service",
    description: "Manage services",
    icon: Scissors,
    href: "/services",
  },
];

export default function QuickActions() {
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-zinc-200 p-5">
        <h2 className="text-lg font-semibold text-zinc-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Frequently used actions
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4 p-5 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              onClick={() => router.push(action.href)}
              className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-black hover:bg-white hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white transition-colors group-hover:bg-zinc-800">
                <Icon size={22} />
              </div>

              <h3 className="font-semibold text-zinc-900">
                {action.title}
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
