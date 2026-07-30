import {
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  Gift,
  LayoutDashboard,
  Receipt,
  Scissors,
  Settings,
  UserCircle,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

export const navigation = [
  {
    title: "MAIN",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Appointments", href: "/appointments", icon: CalendarDays },
      { name: "Customers", href: "/customers", icon: Users },
      { name: "Employees", href: "/employees", icon: UserCog },
      { name: "Services", href: "/services", icon: Scissors },
      { name: "Billing", href: "/billing", icon: Receipt },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { name: "Payroll", href: "/payroll", icon: Wallet },
      { name: "Inventory", href: "/inventory", icon: Boxes },
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Loyalty", href: "/loyalty", icon: Gift },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Profile", href: "/profile", icon: UserCircle },
    ],
  },
];