import type { ReactNode } from "react";
import AppHeader from "@/src/components/layout/AppHeader";
import AppSidebar from "@/src/components/layout/AppSidebar";
import ERPBootstrap from "@/src/components/erp/ERPBootstrap";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ERPBootstrap><div className="h-screen overflow-hidden bg-zinc-100"><div className="flex h-full"><div className="hidden lg:block"><AppSidebar /></div><div className="flex min-w-0 flex-1 flex-col"><AppHeader /><main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main></div></div></div></ERPBootstrap>;
}