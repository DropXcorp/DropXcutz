import { notFound } from "next/navigation";
import ERPModuleClient from "@/src/components/erp/ERPModuleClient";

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
  return <ERPModuleClient module={module as (typeof modules)[number]} />;
}
