import { motion } from "framer-motion";
import Image from "next/image";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock,
  Edit2,
  Eye,
  FileClock,
  FlaskConical,
  KeyRound,
  LayoutDashboard,
  Plus,
  Search,
  ShieldAlert,
  LogOut,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";

export type Status = "TRIAL" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";

export type Salon = {
  id: string;
  code: string;
  salonName: string;
  legalName?: string | null;
  phone?: string | null;
  email: string;
  city: string | null;
  state?: string | null;
  status: Status;
  subscriptionPlan: string;
  trialEndsAt?: string | null;
  createdAt: string;
  paidRevenue: number;
  _count: { customers: number; appointments: number; employees?: number };
};

export type Subscription = {
  id: string;
  salonName: string;
  code: string;
  subscriptionPlan: string;
  status: Status;
  trialEndsAt: string | null;
  createdAt: string;
  _count?: { appointments: number; customers: number; employees: number };
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  salon: { id: string; salonName: string; code: string } | null;
  platformRole?: { id: string; name: string } | null;
};

export type AuditItem = {
  id: string;
  actorId: string | null;
  actor?: { name: string; email: string };
  action: string;
  entity: string;
  entityId: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
};

export type SettingsData = {
  platformName: string;
  supportEmail: string | null;
  defaultTrialDays: number;
  sessionHours: number;
  passwordMinimumLength: number;
};

export type OverviewMetrics = {
  totalSalons: number;
  activeSalons: number;
  trialSalons: number;
  suspendedSalons: number;
  totalUsers: number;
  totalCustomers: number;
  totalAppointments: number;
  totalRevenue: number;
};

export type OverviewData = {
  metrics: OverviewMetrics;
  salons: Salon[];
  recentAudit: AuditItem[];
};

export type Section =
  | "Overview"
  | "Salons"
  | "Users"
  | "Subscriptions"
  | "Plans"
  | "Audit Log"
  | "Settings"
  | "Notifications"
  | "Financials"
  | "Operations";

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10";

export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60";

export const money = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v || 0);

export const date = (v: string | null | undefined) =>
  v
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
        new Date(v),
      )
    : "Not set";

export const tones: Record<Status, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  TRIAL: "border-amber-200 bg-amber-50 text-amber-700",
  SUSPENDED: "border-rose-200 bg-rose-50 text-rose-700",
  ARCHIVED: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-transparent">
        <Image src="/logo.png" alt="DropXcutz logo" fill sizes="40px" className="object-cover" priority />
      </div>
      <div>
        <b className="text-base text-zinc-950 font-bold">DropXCutz</b>
        <p className="text-xs text-zinc-500 font-medium">Super Admin Platform</p>
      </div>
    </div>
  );
}

export function Navigation({
  items,
  section,
  choose,
}: {
  items: readonly (readonly [typeof LayoutDashboard, Section])[];
  section: Section;
  choose: (s: Section) => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-5">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Platform Control
      </p>
      {items.map(([Icon, label]) => (
        <motion.button
          key={label}
          onClick={() => choose(label)}
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.98 }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            section === label
              ? "bg-zinc-950 text-white shadow-sm"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
          {label}
          {section === label && (
            <i className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </motion.button>
      ))}
    </nav>
  );
}

export function SidebarFooter({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="m-3 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 shadow-sm">
      <b className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-xs text-white">
        SA
      </b>
      <div>
        <p className="text-sm font-bold text-zinc-900">Platform Admin</p>
        <p className="text-xs text-zinc-500">Root authorization</p>
      </div>
      <button type="button" onClick={onLogout} title="Log out" className="ml-auto rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-950">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Platform workspace</p>
      <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
        <p className="mt-4 text-sm font-semibold text-zinc-600">Connecting to platform...</p>
      </div>
    </main>
  );
}

export function Notice({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "error" | "success";
  onClose: () => void;
}) {
  const ok = type === "success";
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {ok ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : <Activity className="h-4 w-4 shrink-0 text-rose-600" />}
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="p-1 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <b className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">{label}</b>
      {children}
      {hint && <small className="mt-1 block text-xs text-zinc-400">{hint}</small>}
    </label>
  );
}

export function Input({
  label,
  hint,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input className={inputClass} {...p} />
    </Field>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_35px_-24px_rgba(15,23,42,0.5)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h3 className="text-base font-bold text-slate-950">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Avatar({ name, round = false }: { name: string; round?: boolean }) {
  const s = (name || "Salon")
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
  return (
    <b
      className={`grid h-10 w-10 shrink-0 place-items-center bg-zinc-100 text-xs font-bold text-zinc-800 ${
        round ? "rounded-full" : "rounded-xl"
      }`}
    >
      {s}
    </b>
  );
}

export function StatusBadge({ value }: { value?: Status }) {
  const safe = value && value in tones ? value : "ARCHIVED";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${tones[safe]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {safe}
    </span>
  );
}

export function Empty({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <Search className="mx-auto h-8 w-8 text-zinc-300" />
        <b className="mt-4 block font-bold text-zinc-800">{title}</b>
        <p className="mt-1 text-sm text-zinc-500">{message}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export function Table({
  head,
  loading,
  empty,
  children,
}: {
  head: string[];
  loading: boolean;
  empty?: { title: string; message: string; action?: React.ReactNode };
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <div className="animate-pulse p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-zinc-100" />
        ))}
      </div>
    );
  if (empty) return <Empty {...empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="admin-table min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <tr>
            {head.map((x) => (
              <th key={x} className="whitespace-nowrap px-5 py-3.5">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">{children}</tbody>
      </table>
    </div>
  );
}

export function SignIn({
  error,
  submitting,
  onSubmit,
  clearError,
}: {
  error: string;
  submitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  clearError: () => void;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-zinc-950 p-5">
      <div className="absolute h-[520px] w-[520px] rounded-full bg-zinc-900/40 blur-3xl" />
      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onSubmit={onSubmit}
        onChange={clearError}
        className="relative w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-2xl border border-zinc-100"
      >
        <Brand />
        <div className="mt-9">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Control Plane</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-950">Platform Admin Sign In</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Enter platform credentials to manage all salon workspaces.
          </p>
        </div>
        {error && (
          <div className="mt-5">
            <Notice type="error" message={error} onClose={clearError} />
          </div>
        )}
        <div className="mt-6 space-y-4">
          <Field label="Platform Email">
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@dropxcutz.com"
              className={inputClass}
            />
          </Field>
          <Field label="Master Password">
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputClass}
            />
          </Field>
          <button disabled={submitting} className={`${buttonClass} w-full py-3 mt-2`}>
            {submitting ? "Authenticating..." : "Sign In to Platform"}
          </button>
        </div>
      </motion.form>
    </main>
  );
}

// -------------------------------------------------------------
// 1. OVERVIEW VIEW (Live Metrics + Health + Salons)
// -------------------------------------------------------------
export function Overview({
  overview,
  onViewSalons,
  onUpdateStatus,
}: {
  overview: OverviewData | null;
  onViewSalons: () => void;
  onUpdateStatus: (salonId: string, status: Status) => void;
}) {
  const metrics = overview?.metrics ?? {
    totalSalons: 0,
    activeSalons: 0,
    trialSalons: 0,
    suspendedSalons: 0,
    totalUsers: 0,
    totalCustomers: 0,
    totalAppointments: 0,
    totalRevenue: 0,
  };

  const salons = overview?.salons ?? [];
  const rate = metrics.totalSalons ? Math.round((metrics.activeSalons / metrics.totalSalons) * 100) : 0;

  const cards = [
    [Building2, "Total Salons", metrics.totalSalons, `${metrics.activeSalons} Active, ${metrics.trialSalons} Trial`],
    [CircleDollarSign, "Platform Revenue", money(metrics.totalRevenue), "Gross collected across all salons"],
    [Users, "Total Customers", metrics.totalCustomers, "Registered platform clients"],
    [CalendarDays, "Appointments", metrics.totalAppointments, "Total recorded bookings"],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([Icon, label, value, sub]) => (
          <div
            key={label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow transition"
          >
            <div className="flex justify-between items-start">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-900">
                <Icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-300" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-950">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{sub}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_.8fr]">
        <Panel
          title="Recent Salon Workspaces"
          subtitle="Latest salon accounts on the platform"
          action={
            <button
              onClick={onViewSalons}
              className="text-xs font-bold uppercase tracking-wider text-zinc-900 hover:underline"
            >
              View all ({metrics.totalSalons})
            </button>
          }
        >
          <div className="divide-y divide-zinc-100">
            {salons.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-zinc-50/50 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={s.salonName} />
                  <div className="min-w-0 flex-1">
                    <b className="text-sm text-zinc-900 block truncate">{s.salonName}</b>
                    <p className="text-xs text-zinc-500">
                      <span className="font-mono text-zinc-700">{s.code}</span> • {s.city || "Location pending"} • {s.subscriptionPlan}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={s.status} />
                  <div className="flex gap-1">
                    {s.status !== "ACTIVE" && (
                      <button
                        onClick={() => onUpdateStatus(s.id, "ACTIVE")}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        title="Activate Salon"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {s.status !== "SUSPENDED" && (
                      <button
                        onClick={() => onUpdateStatus(s.id, "SUSPENDED")}
                        className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        title="Suspend Salon"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!salons.length && (
              <Empty
                title="No salon workspaces"
                message="Add your first salon using the 'Add Salon' button above."
              />
            )}
          </div>
        </Panel>

        <Panel title="Platform Health & Capacity" subtitle="Account status distribution">
          <div className="p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-bold text-zinc-950">{rate}%</p>
                <p className="text-xs text-zinc-500">Active Workspaces Ratio</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                {metrics.activeSalons} of {metrics.totalSalons} Active
              </span>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-sm">
                <span className="text-zinc-600 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                </span>
                <b className="text-zinc-950 font-bold">{metrics.activeSalons}</b>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-sm">
                <span className="text-zinc-600 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> On Trial
                </span>
                <b className="text-zinc-950 font-bold">{metrics.trialSalons}</b>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-sm">
                <span className="text-zinc-600 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Suspended
                </span>
                <b className="text-zinc-950 font-bold">{metrics.suspendedSalons}</b>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-sm">
                <span className="text-zinc-600 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-zinc-400" /> Total Users
                </span>
                <b className="text-zinc-950 font-bold">{metrics.totalUsers}</b>
              </div>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

// -------------------------------------------------------------
// 2. SALONS VIEW (Full Management & Actions)
// -------------------------------------------------------------
export function SalonsView({
  salons,
  total,
  loading,
  search,
  setSearch,
  onCreate,
  onEdit,
  onUpdateStatus,
  onDelete,
  onRestore,
  onViewDetails,
}: {
  salons: Salon[];
  total: number;
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  onCreate: () => void;
  onEdit: (salon: Salon) => void;
  onUpdateStatus: (salonId: string, status: Status) => void;
  onDelete: (salon: Salon) => void;
  onRestore: (salon: Salon) => void;
  onViewDetails: (salon: Salon) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = salons.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    return true;
  });
  const activeSalons = salons.filter((salon) => salon.status === "ACTIVE").length;
  const trialSalons = salons.filter((salon) => salon.status === "TRIAL").length;
  const totalRevenue = salons.reduce((sum, salon) => sum + salon.paidRevenue, 0);
  const totalAppointments = salons.reduce(
    (sum, salon) => sum + (salon._count?.appointments ?? 0),
    0,
  );
  const metrics = [
    { label: "Total Salons", value: total, hint: "Across platform", Icon: Building2, tone: "bg-blue-50 text-blue-600" },
    { label: "Active Salons", value: activeSalons, hint: `${total ? Math.round((activeSalons / total) * 100) : 0}% of total`, Icon: TrendingUp, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Trial Salons", value: trialSalons, hint: `${total ? Math.round((trialSalons / total) * 100) : 0}% of total`, Icon: FlaskConical, tone: "bg-amber-50 text-amber-600" },
    { label: "Total Revenue", value: money(totalRevenue), hint: "Across all salons", Icon: CircleDollarSign, tone: "bg-indigo-50 text-indigo-600" },
    { label: "Appointments", value: totalAppointments, hint: "Total scheduled", Icon: CalendarDays, tone: "bg-violet-50 text-violet-600" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="space-y-5"
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, hint, Icon, tone }, index) => (
          <motion.article
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.045, duration: 0.25 }}
            whileHover={{ y: -3 }}
            className="flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)] transition-shadow hover:shadow-[0_16px_35px_-20px_rgba(37,99,235,0.3)]"
          >
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">{hint}</p>
            </div>
          </motion.article>
        ))}
      </section>

    <Panel
      title="Salon Workspaces Directory"
      subtitle={`${total} salons configured across platform`}
      action={
        <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Add Salon
        </button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/60 p-4 sm:px-6">
        <label className="relative block max-w-sm flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, email, city or plan..."
            className={`${inputClass} border-slate-200 py-3 pl-10 shadow-sm focus:border-blue-400 focus:ring-blue-500/10`}
          />
        </label>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {["ALL", "ACTIVE", "TRIAL", "SUSPENDED", "ARCHIVED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-1.5 transition ${
                statusFilter === tab
                  ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <Table
        head={[
          "Salon Workspace ↕",
          "Plan ↕",
          "Customers ↕",
          "Appointments ↕",
          "Paid Revenue ↕",
          "Status ↕",
          "Actions",
        ]}
        loading={loading}
        empty={
          !filtered.length
            ? {
                title: search ? "No matching salons" : "No salons in this view",
                message: search
                  ? "Try adjusting your search criteria."
                  : "Create a new salon to get started.",
                action: !search && (
                  <button onClick={onCreate} className={buttonClass}>
                    <Plus className="h-4 w-4" /> Add Salon
                  </button>
                ),
              }
            : undefined
        }
      >
        {filtered.map((s) => (
          <tr key={s.id} className="group transition-colors duration-200 hover:bg-blue-50/35">
            <td data-label="Salon" className="px-5 py-3.5">
              <div className="flex gap-3 items-center">
                <Avatar name={s.salonName} />
                <div>
                  <b className="text-sm font-bold text-slate-900">{s.salonName}</b>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span className="font-mono text-zinc-700">{s.code}</span> • {s.city || "Location pending"} • {s.email}
                  </p>
                </div>
              </div>
            </td>
            <td data-label="Plan" className="px-5 py-3.5">
              <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {s.subscriptionPlan}
              </span>
            </td>
            <td data-label="Customers" className="px-5 py-3.5 font-medium text-slate-700">
              {s._count?.customers || 0}
            </td>
            <td data-label="Appointments" className="px-5 py-3.5 font-medium text-slate-700">
              {s._count?.appointments || 0}
            </td>
            <td data-label="Revenue" className="px-5 py-3.5 font-bold text-slate-900">
              {money(s.paidRevenue)}
            </td>
            <td data-label="Status" className="px-5 py-3.5">
              <StatusBadge value={s.status} />
            </td>
            <td data-label="Actions" className="px-5 py-3.5 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => onViewDetails(s)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {s.status !== "ARCHIVED" && <button
                  onClick={() => onEdit(s)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
                  title="Edit Salon Profile"
                >
                  <Edit2 className="h-4 w-4" />
                </button>}
                {s.status === "ARCHIVED" ? (
                  <button
                    onClick={() => onRestore(s)}
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                    title="Restore Salon as Suspended"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                ) : s.status === "ACTIVE" ? (
                  <button
                    onClick={() => onUpdateStatus(s.id, "SUSPENDED")}
                    className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition"
                    title="Suspend Salon"
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdateStatus(s.id, "ACTIVE")}
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                    title="Activate Salon"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {s.status !== "ARCHIVED" && <button
                  onClick={() => onDelete(s)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  title="Archive Salon"
                >
                  <Trash2 className="h-4 w-4" />
                </button>}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
    </motion.div>
  );
}

// -------------------------------------------------------------
// 3. SUBSCRIPTIONS VIEW (Plan Upgrades & Trial Extension)
// -------------------------------------------------------------
export function SubscriptionsView({
  items,
  loading,
  onUpgradePlan,
  onExtendTrial,
  onUpdateStatus,
}: {
  items: Subscription[];
  loading: boolean;
  onUpgradePlan: (sub: Subscription, newPlan: string) => void;
  onExtendTrial: (sub: Subscription) => void;
  onUpdateStatus: (salonId: string, status: Status) => void;
}) {
  const [now] = useState(() => Date.now());
  return (
    <Panel
      title="Subscription Plans & Accounts"
      subtitle="Manage tiers, trial extensions, and status"
    >
      <Table
        head={["Salon Workspace", "Current Plan", "Status", "Trial Expiry", "Account Created", "Actions"]}
        loading={loading}
        empty={
          !items.length
            ? {
                title: "No subscriptions found",
                message: "Salon subscription accounts will appear here.",
              }
            : undefined
        }
      >
        {items.map((x) => {
          let trialDaysLeft = null;
          if (x.trialEndsAt) {
            const diff = new Date(x.trialEndsAt).getTime() - now;
            trialDaysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          }

          return (
            <tr key={x.id} className="hover:bg-zinc-50/50 transition">
              <td data-label="Salon" className="px-5 py-4">
                <b>{x.salonName}</b>
                <p className="text-xs text-zinc-500 font-mono">{x.code}</p>
              </td>
              <td data-label="Plan" className="px-5 py-4">
                <select
                  value={x.subscriptionPlan}
                  onChange={(e) => onUpgradePlan(x, e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 outline-none hover:border-zinc-400 transition"
                >
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </td>
              <td data-label="Status" className="px-5 py-4">
                <StatusBadge value={x.status} />
              </td>
              <td data-label="Trial ends" className="px-5 py-4">
                <div>
                  <span className="text-xs text-zinc-700 font-medium block">{date(x.trialEndsAt)}</span>
                  {trialDaysLeft !== null && (
                    <span
                      className={`text-[11px] font-bold ${
                        trialDaysLeft <= 0
                          ? "text-rose-600"
                          : trialDaysLeft <= 5
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {trialDaysLeft <= 0 ? "Trial Expired" : `${trialDaysLeft} days remaining`}
                    </span>
                  )}
                </div>
              </td>
              <td data-label="Started" className="px-5 py-4 text-xs text-zinc-500">
                {date(x.createdAt)}
              </td>
              <td data-label="Actions" className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onExtendTrial(x)}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                  >
                    <Clock className="h-3 w-3" /> Extend Trial
                  </button>
                  {x.status === "SUSPENDED" ? (
                    <button
                      onClick={() => onUpdateStatus(x.id, "ACTIVE")}
                      className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(x.id, "SUSPENDED")}
                      className="rounded-lg bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 text-xs font-semibold hover:bg-rose-100 transition"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </Panel>
  );
}

// -------------------------------------------------------------
// 4. USERS VIEW (Platform & Salon Admins + Reset Password)
// -------------------------------------------------------------
export function UsersView({
  items,
  loading,
  onToggle,
  onCreateUser,
  onResetPassword,
  roles,
  onAssignPlatformRole,
}: {
  items: PlatformUser[];
  loading: boolean;
  onToggle: (u: PlatformUser) => void;
  onCreateUser: () => void;
  onResetPassword: (u: PlatformUser) => void;
  roles: { id: string; name: string }[];
  onAssignPlatformRole: (user: PlatformUser, platformRoleId: string | null) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = items.filter((u) =>
    `${u.name} ${u.email} ${u.role} ${u.salon?.salonName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <Panel
      title="User Access & Security"
      subtitle="Manage platform and salon administrator credentials"
      action={
        <button onClick={onCreateUser} className={buttonClass}>
          <UserPlus className="h-4 w-4" /> Add Admin User
        </button>
      }
    >
      <div className="border-b border-zinc-100 p-4 sm:px-6 bg-zinc-50/50">
        <label className="relative block max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email or workspace..."
            className={`${inputClass} pl-10`}
          />
        </label>
      </div>

      <Table
        head={["User Identity", "Role", "Assigned Workspace", "Status", "Actions"]}
        loading={loading}
        empty={
          !filtered.length
            ? { title: "No users found", message: "User accounts will appear here." }
            : undefined
        }
      >
        {filtered.map((u) => (
          <tr key={u.id} className="hover:bg-zinc-50/50 transition">
            <td data-label="User" className="px-5 py-4">
              <div className="flex gap-3 items-center">
                <Avatar name={u.name} round />
                <div>
                  <b className="text-sm font-bold text-zinc-900">{u.name}</b>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </div>
              </div>
            </td>
            <td data-label="Role" className="px-5 py-4">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  u.role === "PLATFORM_ADMIN"
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {u.role.replaceAll("_", " ")}
              </span>
              {u.role === "PLATFORM_ADMIN" && <select value={u.platformRole?.id ?? ""} onChange={(event) => onAssignPlatformRole(u, event.target.value || null)} className="mt-2 block rounded border border-zinc-200 bg-white px-2 py-1 text-xs"><option value="">Legacy full access</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>}
            </td>
            <td data-label="Workspace" className="px-5 py-4 text-sm text-zinc-700">
              {u.salon ? (
                <div>
                  <span className="font-semibold">{u.salon.salonName}</span>
                  <span className="block text-xs text-zinc-400 font-mono">{u.salon.code}</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                  Platform Wide
                </span>
              )}
            </td>
            <td data-label="Status" className="px-5 py-4">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  u.active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {u.active ? "Active" : "Disabled"}
              </span>
            </td>
            <td data-label="Actions" className="px-5 py-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onResetPassword(u)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                  title="Reset Password"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Reset Pass
                </button>
                <button
                  onClick={() => onToggle(u)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    u.active
                      ? "border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                      : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  {u.active ? "Disable" : "Enable"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}

// -------------------------------------------------------------
// 5. AUDIT LOG VIEW (Actor Resolution & Details)
// -------------------------------------------------------------
export function AuditView({
  items,
  loading,
}: {
  items: AuditItem[];
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");

  const filtered = items.filter((x) => {
    if (entityFilter !== "ALL" && (x.entity ?? "") !== entityFilter) return false;
    const q = search.toLowerCase();
    return (
      (x.action ?? "").toLowerCase().includes(q) ||
      (x.entity ?? "").toLowerCase().includes(q) ||
      (x.actor?.name || "").toLowerCase().includes(q) ||
      (x.actor?.email || "").toLowerCase().includes(q) ||
      (x.entityId || "").toLowerCase().includes(q)
    );
  });

  return (
    <Panel title="Platform Activity Audit Trail" subtitle="Chronological record of changes and events">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 p-4 sm:px-6 bg-zinc-50/50">
        <label className="relative block max-w-sm flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor name, email or entity..."
            className={`${inputClass} pl-10`}
          />
        </label>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
        >
          <option value="ALL">All Entities</option>
          <option value="SALON">Salon</option>
          <option value="USER">User</option>
          <option value="PLATFORM">Platform</option>
          <option value="NOTIFICATION">Notification</option>
        </select>
      </div>

      <Table
        head={["Actor / Admin", "Action Event", "Entity", "Reference / ID", "Timestamp"]}
        loading={loading}
        empty={
          !filtered.length
            ? {
                title: "No audit records",
                message: "Platform operations will be recorded here.",
              }
            : undefined
        }
      >
        {filtered.map((x) => (
          <tr key={x.id} className="hover:bg-zinc-50/50 transition">
            <td data-label="Actor" className="px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 grid place-items-center rounded-full bg-zinc-900 text-white text-[10px] font-bold">
                  {(x.actor?.name || "AD").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <b className="text-xs font-bold text-zinc-900 block">{x.actor?.name || "System Admin"}</b>
                  <span className="text-[11px] text-zinc-400">{x.actor?.email || "system@dropxcutz.com"}</span>
                </div>
              </div>
            </td>
            <td data-label="Action" className="px-5 py-4 font-semibold text-zinc-900">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-mono font-bold text-zinc-800">
                <FileClock className="h-3 w-3 text-zinc-500" />
                {x.action}
              </span>
            </td>
            <td data-label="Entity" className="px-5 py-4 text-xs font-semibold text-zinc-600">
              {x.entity}
            </td>
            <td data-label="Reference" className="px-5 py-4 font-mono text-xs text-zinc-500">
              {x.entityId || "—"}
            </td>
            <td data-label="Timestamp" className="px-5 py-4 text-xs text-zinc-500">
              {new Date(x.createdAt).toLocaleString("en-IN")}
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}

// -------------------------------------------------------------
// 6. FINANCIALS VIEW (Platform-wide Analytics)
// -------------------------------------------------------------
export function FinancialView({ salons }: { salons: Salon[] }) {
  const revenue = salons.reduce((sum, salon) => sum + (salon.paidRevenue || 0), 0);
  const customers = salons.reduce((sum, salon) => sum + (salon._count?.customers || 0), 0);
  const appointments = salons.reduce((sum, salon) => sum + (salon._count?.appointments || 0), 0);
  const average = salons.length ? revenue / salons.length : 0;
  const ranked = [...salons].sort((a, b) => (b.paidRevenue || 0) - (a.paidRevenue || 0));

  const planStats = {
    Starter: salons.filter((s) => s.subscriptionPlan === "Starter").length,
    Professional: salons.filter((s) => s.subscriptionPlan === "Professional").length,
    Enterprise: salons.filter((s) => s.subscriptionPlan === "Enterprise").length,
  };

  const statCards = [
    { title: "Total Invoiced Revenue", val: money(revenue), sub: "Paid revenue across platform", Icon: CircleDollarSign },
    { title: "Average Revenue / Salon", val: money(average), sub: "Across all active workspaces", Icon: TrendingUp },
    { title: "Platform Client Base", val: String(customers), sub: "Registered salon customers", Icon: Users },
    { title: "Total Bookings Processed", val: String(appointments), sub: "Appointments completed", Icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ title, val, sub, Icon }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{title}</p>
                <p className="mt-2 text-2xl font-bold text-zinc-950">{val}</p>
                <p className="mt-1 text-xs text-zinc-500">{sub}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-900">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Revenue Leaderboard by Salon" subtitle="Ranked gross paid revenue per workspace">
          {!ranked.length ? (
            <p className="p-8 text-center text-sm text-zinc-500">No salon financial records yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {ranked.map((salon, index) => (
                <div key={salon.id} className="flex items-center gap-4 p-5 hover:bg-zinc-50/50 transition">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-sm text-zinc-900">{salon.salonName}</p>
                        <p className="text-xs text-zinc-500 font-mono">
                          {salon.code} • {salon._count?.customers || 0} customers • {salon.subscriptionPlan}
                        </p>
                      </div>
                      <b className="text-sm font-bold text-zinc-950">{money(salon.paidRevenue)}</b>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        style={{
                          width: `${revenue ? Math.max((salon.paidRevenue / revenue) * 100, 3) : 0}%`,
                        }}
                        className="h-full rounded-full bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Plan Distribution" subtitle="Active subscription tiers">
          <div className="p-6 space-y-4">
            {Object.entries(planStats).map(([plan, count]) => {
              const pct = salons.length ? Math.round((count / salons.length) * 100) : 0;
              return (
                <div key={plan} className="space-y-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-zinc-700">{plan} Tier</span>
                    <span className="text-zinc-900">{count} salons ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        plan === "Enterprise"
                          ? "bg-purple-600"
                          : plan === "Professional"
                          ? "bg-blue-600"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. NOTIFICATIONS VIEW
// -------------------------------------------------------------
export function NotificationView({
  salons,
  submitting,
  onSubmit,
}: {
  salons: Salon[];
  submitting: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel
      title="Broadcast Platform Notification"
      subtitle="Send high-priority system announcements to salon ERP dashboards"
    >
      <form onSubmit={onSubmit} className="grid gap-5 p-6 max-w-2xl">
        <Field label="Recipient Workspace">
          <select name="salonId" className={inputClass} defaultValue="all">
            <option value="all">📢 All Active Salons (Broadcast)</option>
            {salons.map((salon) => (
              <option key={salon.id} value={salon.id}>
                {salon.salonName} ({salon.code})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Announcement Title">
          <input
            required
            maxLength={160}
            name="title"
            className={inputClass}
            placeholder="e.g. Scheduled System Maintenance Notice"
          />
        </Field>
        <Field label="Message Content">
          <textarea
            required
            maxLength={5000}
            name="message"
            rows={5}
            className={inputClass}
            placeholder="Write the message that salon ERP administrators will receive in their notification bell..."
          />
        </Field>
        <button disabled={submitting} className={`${buttonClass} w-fit`}>
          <Bell className="h-4 w-4" />
          {submitting ? "Transmitting..." : "Send Announcement"}
        </button>
      </form>
    </Panel>
  );
}

// -------------------------------------------------------------
// 8. SETTINGS VIEW
// -------------------------------------------------------------
export function SettingsView({
  settings,
  loading,
  submitting,
  onSubmit,
}: {
  settings: SettingsData | null;
  loading: boolean;
  submitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  if (loading || !settings)
    return <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />;

  return (
    <form onSubmit={onSubmit}>
      <Panel
        title="Platform Configuration"
        subtitle="Global security, authentication and trial policies"
      >
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <Input
            name="platformName"
            label="Platform Brand Name"
            defaultValue={settings.platformName}
          />
          <Input
            name="supportEmail"
            label="Official Support Email"
            type="email"
            defaultValue={settings.supportEmail || ""}
          />
          <Input
            name="defaultTrialDays"
            label="Default Trial Period (Days)"
            type="number"
            min={1}
            defaultValue={settings.defaultTrialDays}
          />
          <Input
            name="sessionHours"
            label="Admin Session Expiry (Hours)"
            type="number"
            min={1}
            defaultValue={settings.sessionHours}
          />
          <Input
            name="passwordMinimumLength"
            label="Minimum Password Length"
            type="number"
            min={8}
            defaultValue={settings.passwordMinimumLength}
          />
        </div>
        <div className="flex justify-end border-t border-zinc-100 bg-zinc-50 p-4 sm:px-6">
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Saving..." : "Save Platform Settings"}
          </button>
        </div>
      </Panel>
    </form>
  );
}

// -------------------------------------------------------------
// MODALS
// -------------------------------------------------------------

// A. Create Salon Modal
export function CreateSalonModal({
  onSubmit,
  onClose,
  submitting,
  temporaryPassword,
  onTemporaryPasswordChange,
  onGeneratePassword,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  submitting: boolean;
  temporaryPassword: string;
  onTemporaryPasswordChange: (value: string) => void;
  onGeneratePassword: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl border border-zinc-100"
      >
        <header className="flex justify-between items-center border-b p-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase text-zinc-400">New Workspace</p>
            <h2 className="text-xl font-bold text-zinc-950">Add Salon Workspace</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </header>
        <div className="overflow-y-auto p-5 sm:px-7 space-y-6">
          <div>
            <b className="text-sm font-bold text-zinc-900 block mb-3">Salon Identity & Location</b>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="salonName" label="Salon Trade Name" placeholder="Velvet Glow Salon & Spa" required autoFocus />
              <Input name="code" label="Salon URL Code" placeholder="velvet-glow" required />
              <Input name="legalName" label="Legal Entity Name" placeholder="Velvet Glow Pvt Ltd" required />
              <Input name="phone" label="Official Phone" placeholder="+91 9876543210" required />
              <Input name="email" label="Official Salon Email" type="email" placeholder="contact@velvetglow.com" required />
              <Field label="Subscription Tier">
                <select name="plan" className={inputClass} defaultValue="Starter">
                  <option value="Starter">Starter Plan</option>
                  <option value="Business">Business Plan</option>
                  <option value="Professional">Professional Plan</option>
                  <option value="Enterprise">Enterprise Plan</option>
                </select>
              </Field>
              <Input name="city" label="City" placeholder="Bangalore" />
              <Input name="state" label="State" placeholder="Karnataka" />
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-5">
            <b className="text-sm font-bold text-zinc-900 block mb-3">Initial Administrator Account</b>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="adminName" label="Administrator Full Name" placeholder="Rohan Sharma" required />
              <Input name="adminEmail" label="Admin Login Email" type="email" placeholder="rohan@velvetglow.com" required />
              <div className="sm:col-span-2">
                <Field
                  label="Temporary Password"
                  hint="Share this temporary password securely with the salon admin."
                >
                  <div className="flex gap-2">
                    <input
                      required
                      name="adminPassword"
                      type="text"
                      minLength={8}
                      value={temporaryPassword}
                      onChange={(e) => onTemporaryPasswordChange(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={onGeneratePassword}
                      className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                    >
                      Generate New
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-3 border-t bg-zinc-50 p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Creating..." : "Create Salon Workspace"}
          </button>
        </footer>
      </form>
    </div>
  );
}

// B. Edit Salon Modal
export function EditSalonModal({
  salon,
  onClose,
  onSubmit,
  submitting,
}: {
  salon: Salon;
  onClose: () => void;
  onSubmit: (id: string, patch: Partial<Salon>) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    salonName: salon.salonName,
    legalName: salon.legalName || "",
    phone: salon.phone || "",
    email: salon.email,
    city: salon.city || "",
    state: salon.state || "",
    subscriptionPlan: salon.subscriptionPlan,
    status: salon.status,
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(salon.id, form);
        }}
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl border border-zinc-100"
      >
        <header className="flex justify-between items-center border-b p-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase text-zinc-400">Edit Salon</p>
            <h2 className="text-xl font-bold text-zinc-950">{salon.salonName}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </header>
        <div className="overflow-y-auto p-5 sm:px-7 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Salon Trade Name">
              <input
                required
                value={form.salonName}
                onChange={(e) => setForm({ ...form, salonName: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Legal Entity Name">
              <input
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Contact Phone">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Official Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="City">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Subscription Plan">
              <select
                value={form.subscriptionPlan}
                onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value })}
                className={inputClass}
              >
                <option value="Starter">Starter</option>
                <option value="Business">Business</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </Field>
            <Field label="Account Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                className={inputClass}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="TRIAL">TRIAL</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </Field>
          </div>
        </div>
        <footer className="flex justify-end gap-3 border-t bg-zinc-50 p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </footer>
      </form>
    </div>
  );
}

// C. Create User Modal
export function CreateUserModal({
  salons,
  roles,
  onClose,
  onSubmit,
  submitting,
}: {
  salons: Salon[];
  roles: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (user: { name: string; email: string; password: string; role: string; salonId?: string; platformRoleId?: string }) => void;
  submitting: boolean;
}) {
  const [role, setRole] = useState("PLATFORM_ADMIN");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onSubmit({
            name: String(f.get("name")),
            email: String(f.get("email")),
            password: String(f.get("password")),
            role: String(f.get("role")),
            salonId: String(f.get("salonId") || "") || undefined,
            platformRoleId: String(f.get("platformRoleId") || "") || undefined,
          });
        }}
        className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl border border-zinc-100"
      >
        <header className="flex justify-between items-center border-b p-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase text-zinc-400">Security & Credentials</p>
            <h2 className="text-xl font-bold text-zinc-950">Add Administrator User</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </header>
        <div className="overflow-y-auto p-5 sm:px-7 space-y-4">
          <Input name="name" label="Full Name" placeholder="Gopal Verma" required autoFocus />
          <Input name="email" label="Email Address" type="email" placeholder="admin@example.com" required />
          <Input name="password" label="Initial Password (8+ characters)" type="password" minLength={8} required />
          <Field label="Administrator Role">
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              <option value="PLATFORM_ADMIN">PLATFORM_ADMIN (Root Access)</option>
              <option value="SALON_ADMIN">SALON_ADMIN (Salon Workspace Access)</option>
            </select>
          </Field>
          {role === "SALON_ADMIN" && (
            <Field label="Assign to Salon Workspace">
              <select name="salonId" className={inputClass} required>
                <option value="">Select Salon...</option>
                {salons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.salonName} ({s.code})
                  </option>
                ))}
              </select>
            </Field>
          )}
          {role === "PLATFORM_ADMIN" && <Field label="Platform permission role"><select name="platformRoleId" className={inputClass}><option value="">Legacy full access</option>{roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>}
        </div>
        <footer className="flex justify-end gap-3 border-t bg-zinc-50 p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Creating..." : "Create User"}
          </button>
        </footer>
      </form>
    </div>
  );
}

// D. Reset Password Modal
export function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
  submitting,
}: {
  user: PlatformUser;
  onClose: () => void;
  onSubmit: (id: string, newPass: string) => void;
  submitting: boolean;
}) {
  const [password, setPassword] = useState("");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(user.id, password);
        }}
        className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl border border-zinc-100"
      >
        <header className="flex justify-between items-center border-b p-5">
          <div>
            <p className="text-xs font-bold uppercase text-zinc-400">Password Reset</p>
            <h2 className="text-lg font-bold text-zinc-950">{user.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </header>
        <div className="p-5 space-y-4">
          <p className="text-xs text-zinc-500">
            Set a new master password for <b className="text-zinc-900">{user.email}</b>.
          </p>
          <Field label="New Password (8+ characters)">
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className={inputClass}
              autoFocus
            />
          </Field>
        </div>
        <footer className="flex justify-end gap-3 border-t bg-zinc-50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </footer>
      </form>
    </div>
  );
}

// E. Extend Trial Modal
export function ExtendTrialModal({
  subscription,
  onClose,
  onSubmit,
  submitting,
}: {
  subscription: Subscription;
  onClose: () => void;
  onSubmit: (id: string, date: string) => void;
  submitting: boolean;
}) {
  const [targetDate, setTargetDate] = useState(() => subscription.trialEndsAt
    ? new Date(subscription.trialEndsAt).toISOString().split("T")[0]
    : new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(subscription.id, targetDate);
        }}
        className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl border border-zinc-100"
      >
        <header className="flex justify-between items-center border-b p-5">
          <div>
            <p className="text-xs font-bold uppercase text-zinc-400">Trial Extension</p>
            <h2 className="text-lg font-bold text-zinc-950">{subscription.salonName}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </header>
        <div className="p-5 space-y-4">
          <Field label="New Trial Expiration Date">
            <input
              required
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  const d = new Date(Date.now() + days * 86400000);
                  setTargetDate(d.toISOString().split("T")[0]);
                }}
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                +{days} Days
              </button>
            ))}
          </div>
        </div>
        <footer className="flex justify-end gap-3 border-t bg-zinc-50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Saving..." : "Set Expiry Date"}
          </button>
        </footer>
      </form>
    </div>
  );
}

// F. Salon Details Drawer
export function SalonDetailsModal({
  salon,
  onClose,
  onManage,
}: {
  salon: Salon;
  onClose: () => void;
  onManage: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl border border-zinc-100">
        <header className="flex justify-between items-center border-b p-5 sm:px-7">
          <div className="flex items-center gap-3">
            <Avatar name={salon.salonName} />
            <div>
              <h2 className="text-xl font-bold text-zinc-950">{salon.salonName}</h2>
              <p className="text-xs text-zinc-500 font-mono">{salon.code} • {salon.city || "Location pending"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </header>
        <div className="overflow-y-auto p-5 sm:px-7 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
              <p className="text-xs font-semibold text-zinc-400 uppercase">Paid Revenue</p>
              <p className="text-xl font-bold text-zinc-900 mt-1">{money(salon.paidRevenue)}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
              <p className="text-xs font-semibold text-zinc-400 uppercase">Total Clients</p>
              <p className="text-xl font-bold text-zinc-900 mt-1">{salon._count?.customers || 0}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
              <p className="text-xs font-semibold text-zinc-400 uppercase">Appointments</p>
              <p className="text-xl font-bold text-zinc-900 mt-1">{salon._count?.appointments || 0}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <b className="font-bold text-zinc-900 block border-b border-zinc-100 pb-2">Workspace Information</b>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-zinc-500">Legal Entity:</span>
              <span className="font-semibold text-zinc-900">{salon.legalName || "—"}</span>
              <span className="text-zinc-500">Official Email:</span>
              <span className="font-semibold text-zinc-900">{salon.email}</span>
              <span className="text-zinc-500">Phone:</span>
              <span className="font-semibold text-zinc-900">{salon.phone || "—"}</span>
              <span className="text-zinc-500">Subscription Tier:</span>
              <span className="font-semibold text-zinc-900">{salon.subscriptionPlan}</span>
              <span className="text-zinc-500">Current Status:</span>
              <span><StatusBadge value={salon.status} /></span>
              <span className="text-zinc-500">Created At:</span>
              <span className="text-zinc-700">{date(salon.createdAt)}</span>
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-3 border-t bg-zinc-50 p-4 sm:px-7">
          <button onClick={onManage} className="rounded-xl border border-zinc-200 bg-white px-5 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100">Open salon workspace</button>
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
