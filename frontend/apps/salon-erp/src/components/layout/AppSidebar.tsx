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
  KeyRound,
  CreditCard,
} from "lucide-react";

import AppLogo from "@/src/components/layout/AppLogo";
import { useERPStore } from "@/src/lib/erp-store";

interface AppSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
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
        feature: "APPOINTMENTS",
      },
      {
        name: "Customers",
        href: "/customers",
        icon: Users,
        feature: "CUSTOMERS",
      },
      {
        name: "Employees",
        href: "/employees",
        icon: UserCog,
        feature: "EMPLOYEES",
      },
      {
        name: "Services",
        href: "/services",
        icon: Scissors,
        feature: "SERVICES",
      },
      {
        name: "Service Setup",
        href: "/service-setup",
        icon: Scissors,
        feature: "SERVICES",
      },
      {
        name: "Billing & POS",
        href: "/billing",
        icon: Receipt,
        feature: "INVOICES",
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
        feature: "EMPLOYEES",
      },
      {
        name: "Leave Requests",
        href: "/leave",
        icon: CalendarCheck,
        feature: "EMPLOYEES",
      },
      {
        name: "Inventory",
        href: "/inventory",
        icon: Boxes,
        feature: "INVENTORY",
      },
      {
        name: "Purchase Orders",
        href: "/purchase-orders",
        icon: ShoppingCart,
        feature: "INVENTORY",
      },
      {
        name: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        feature: "INVENTORY",
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
        feature: "PAYROLL",
      },
      {
        name: "Payments",
        href: "/payments",
        icon: Receipt,
        feature: "INVOICES",
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
        feature: "LOYALTY",
      },
      {
        name: "Membership Tiers",
        href: "/memberships",
        icon: Crown,
        feature: "LOYALTY",
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
      {
        name: "Offers & Gallery",
        href: "/marketing",
        icon: Tag,
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
        name: "Uploads",
        href: "/uploads",
        icon: Boxes,
      },
      {
        name: "Branches",
        href: "/branches",
        icon: Building2,
        feature: "MULTI_BRANCH",
      },
      {
        name: "Time Slots",
        href: "/time-slots",
        icon: CalendarDays,
        feature: "MULTI_BRANCH",
      },
      {
        name: "Audit Log",
        href: "/audit-log",
        icon: BarChart3,
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
        name: "Online Payments",
        href: "/settings/integration",
        icon: CreditCard,
      },
      {
        name: "API & Integrations",
        href: "/settings/api",
        icon: KeyRound,
        feature: "API_INTEGRATIONS",
      },
      {
        name: "Website",
        href: "/settings/website",
        icon: Globe,
        feature: "WEBSITE_MANAGEMENT",
      },
      {
        name: "Profile",
        href: "/profile",
        icon: UserCircle,
      },
    ],
  },
];

export default function AppSidebar({ mobile = false, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const features = useERPStore((state) => state.features);
  const allHrefs = menu.flatMap((section) => section.items.map((item) => item.href));
  const activeHref = allHrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((x, y) => y.length - x.length)[0];
  return (
    <aside className={`flex h-full ${mobile ? "w-full" : "w-72"} flex-col bg-card border-r border-border select-none`}>
      {/* Desktop Logo */}
      {!mobile && (
        <div className="border-b border-border px-6 py-5">
          <AppLogo />
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
        {menu.map((section) => {
          const items = section.items.filter((item) => !item.feature || features.includes(item.feature));
          if (!items.length) return null;
          return (
          <div key={section.title} className="mb-6 last:mb-2">
            <h3 className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {section.title}
            </h3>

            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active = item.href === activeHref;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 transition-all duration-150 ${
                      active
                        ? "bg-primary text-white font-medium shadow-sm"
                        : "text-foreground/70 hover:bg-muted/60 hover:text-foreground font-normal"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={
                        active
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground transition-colors"
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
      <div className="border-t border-border bg-muted/60 p-4">
        <span className="text-xs font-semibold text-foreground/80">DropXcutz ERP</span>
      </div>
    </aside>
  );
}
