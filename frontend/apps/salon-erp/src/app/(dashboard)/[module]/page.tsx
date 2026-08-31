import { notFound } from "next/navigation";
import ERPModuleClient from "@/src/components/erp/ERPModuleClient";
import PhaseTwoConsole, { type PhaseTwoModule } from "@/src/components/erp/PhaseTwoConsole";

const modules = [
  "customers",
  "employees",
  "services",
  "inventory",
  "billing",
  "payroll",
  "reports",
  "loyalty",
  "notifications",
  "settings",
  "profile",
  "branches",
  "attendance",
  "expenses",
  "suppliers",
  "packages",
  "coupons",
  "reviews",
  "memberships",
  "purchase-orders",
  "service-setup",
  "leave",
  "payments",
  "marketing",
  "time-slots",
  "audit-log",
] as const;

export function generateStaticParams() {
  return modules.map((module) => ({ module }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  if (!modules.includes(module as (typeof modules)[number])) notFound();
  if (["service-setup", "leave", "payments", "marketing", "time-slots", "audit-log"].includes(module))
    return <PhaseTwoConsole module={module as PhaseTwoModule} />;
  return <ERPModuleClient module={module as Parameters<typeof ERPModuleClient>[0]["module"]} />;
}
