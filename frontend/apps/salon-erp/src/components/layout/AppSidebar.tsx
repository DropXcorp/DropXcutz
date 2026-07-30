"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCog,
  Scissors,
  Receipt,
  Boxes,
  Wallet,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";

import AppLogo from "@/src/components/layout/AppLogo";

interface AppSidebarProps {
  mobile?: boolean;
}

const menu = [
  {
    title: "MAIN",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Appointments",
        href: "/appointments",
        icon: CalendarDays,
      },
      {
        name: "Customers",
        href: "/customers",
        icon: Users,
      },
      {
        name: "Employees",
        href: "/employees",
        icon: UserCog,
      },
      {
        name: "Services",
        href: "/services",
        icon: Scissors,
      },
      {
        name: "Billing",
        href: "/billing",
        icon: Receipt,
      },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      {
        name: "Inventory",
        href: "/inventory",
        icon: Boxes,
      },
      {
        name: "Payroll",
        href: "/payroll",
        icon: Wallet,
      },
      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
      },
      {
        name: "Super Admin",
        href: "/super-admin",
        icon: ShieldCheck,
      },
    ],
  },
];

export default function AppSidebar({
  mobile = false,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 flex-col bg-white">
      {/* Desktop Logo */}
      {!mobile && (
        <div className="border-b border-zinc-200 px-6 py-6">
          <AppLogo />
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {menu.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="mb-4 px-3 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
              {section.title}
            </h3>

            <div className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                      active
                        ? "bg-black text-white shadow-lg"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
                    }`}
                  >
                    <Icon
                      size={21}
                      className={
                        active
                          ? "text-white"
                          : "text-zinc-500 group-hover:text-black"
                      }
                    />

                    <span className="text-[15px] font-medium">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-5">
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-100 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
            N
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900">
              Nandini
            </p>

            <p className="text-xs text-zinc-500">
              Administrator
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs font-semibold text-zinc-800">
            DropXCut ERP
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Version 1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}
