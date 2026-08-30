import type { ReactNode } from "react";
import AppHeader from "@/src/components/layout/AppHeader";
import AppSidebar from "@/src/components/layout/AppSidebar";
import ERPBootstrap from "@/src/components/erp/ERPBootstrap";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ERPBootstrap>
      <div className="min-h-[100dvh] overflow-hidden bg-zinc-50">
        <div className="flex h-[100dvh] min-h-0">
          <div className="hidden shrink-0 lg:block"><AppSidebar /></div>
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader />
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
              <div className="mx-auto w-full max-w-[1680px]">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </ERPBootstrap>
  );
}
