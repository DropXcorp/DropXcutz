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
  Building2,
  CalendarCheck,
  Truck,
  TrendingDown,
  Gift,
  Package as PackageIcon,
  Tag,
  Star,
  Bell,
  UserCircle,
  ShoppingCart,
  Crown,
  Globe,
  Plug,
} from "lucide-react";

import AppLogo from "@/src/components/layout/AppLogo";
import { useERPStore } from "@/src/lib/erp-store";

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
        name: "Billing & POS",
        href: "/billing",
        icon: Receipt,
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        name: "Attendance",
        href: "/attendance",
        icon: CalendarCheck,
      },
      {
        name: "Inventory",
        href: "/inventory",
        icon: Boxes,
      },
      {
        name: "Purchase Orders",
        href: "/purchase-orders",
        icon: ShoppingCart,
      },
      {
        name: "Suppliers",
        href: "/suppliers",
        icon: Truck,
      },
      {
        name: "Expenses",
        href: "/expenses",
        icon: TrendingDown,
      },
      {
        name: "Payroll",
        href: "/payroll",
        icon: Wallet,
      },
    ],
  },
  {
    title: "MARKETING & GROWTH",
    items: [
      {
        name: "Loyalty & Points",
        href: "/loyalty",
        icon: Gift,
      },
      {
        name: "Membership Tiers",
        href: "/memberships",
        icon: Crown,
      },
      {
        name: "Packages",
        href: "/packages",
        icon: PackageIcon,
      },
      {
        name: "Coupons",
        href: "/coupons",
        icon: Tag,
      },
      {
        name: "Reviews",
        href: "/reviews",
        icon: Star,
      },
    ],
  },
  {
    title: "SYSTEM & CONFIG",
    items: [
      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
      {
        name: "Branches",
        href: "/branches",
        icon: Building2,
      },
      {
        name: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
      },
      {
        name: "Profile",
        href: "/profile",
        icon: UserCircle,
      },
      {
        name: "Website Management",
        href: "/settings/website",
        icon: Globe,
        feature: "WEBSITE_MANAGEMENT",
      },
      {
        name: "API Integration",
        href: "/settings/integration",
        icon: Plug,
        feature: "PUBLIC_API",
      },
    ],
  },
];

export default function AppSidebar({ mobile = false }: AppSidebarProps) {
  const pathname = usePathname();
  const features = useERPStore((state) => state.features);

  return (
    <aside className="flex h-full w-72 flex-col bg-white border-r border-zinc-200 select-none">
      {/* Desktop Logo */}
      {!mobile && (
        <div className="border-b border-zinc-200 px-6 py-5">
          <AppLogo />
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
        {menu.map((section) => {
          const items = section.items.filter((item) => !("feature" in item) || !item.feature || features.includes(item.feature));
          if (!items.length) return null;
          return (
          <div key={section.title} className="mb-6 last:mb-2">
            <h3 className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              {section.title}
            </h3>

            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 transition-all duration-150 ${
                      active
                        ? "bg-zinc-950 text-white font-medium shadow-sm"
                        : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-950 font-normal"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        active
                          ? "text-white"
                          : "text-zinc-500 group-hover:text-zinc-950 transition-colors"
                      }
                    />
                    <span className="text-[14px]">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );})}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-4 bg-zinc-50/50">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div>
            <span className="font-semibold text-zinc-800">DropXcutz ERP</span>
            <p className="text-[10px] text-zinc-400">v1.2.0 • Active Node</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        </div>
      </div>
    </aside>
  );
}
