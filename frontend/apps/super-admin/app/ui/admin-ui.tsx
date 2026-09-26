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
  LogIn,
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
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table as UiTable, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TrendCharts, type Trend } from "@/components/trend-charts";

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
  trends?: Trend[];
};

export type Section =
  | "Overview"
  | "Salons"
  | "Users"
  | "Subscriptions"
  | "Plans"
  | "Sessions"
  | "Websites"
  | "Audit Log"
  | "Settings"
  | "Notifications"
  | "Financials"
  | "Operations";

export type PlatformWebsite = {
  salonId: string;
  salonName: string;
  code: string;
  slug: string;
  salonStatus: Status;
  type: "NONE" | "TEMPLATE" | "CUSTOM";
  isPublished: boolean;
  publishedAt: string | null;
  customDomain: string | null;
  domainStatus: "NONE" | "PENDING_DNS" | "VERIFYING" | "ACTIVE" | "FAILED";
  domainError: string | null;
  liveUrl: string | null;
  updatedAt: string;
};

export type SystemCheck = { key: string; label: string; ok: boolean; level: "required" | "recommended" | "optional"; detail: string };

export function SystemStatusCard({ checks }: { checks: SystemCheck[] | null }) {
  const [open, setOpen] = useState(false);
  if (!checks) return null;
  const failing = checks.filter((check) => !check.ok);
  const blockers = failing.filter((check) => check.level === "required");
  const tone = blockers.length ? "border-rose-200 bg-rose-50" : failing.some((check) => check.level === "recommended") ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50";
  return (
    <div className={cn("rounded-2xl border p-4", tone)}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span>
          <b className="block text-sm text-foreground">System status</b>
          <span className="text-xs text-foreground/70">
            {blockers.length ? `${blockers.length} required setting${blockers.length === 1 ? "" : "s"} missing — websites or payments may not work.` : failing.length ? `${failing.length} recommended setting${failing.length === 1 ? "" : "s"} to review.` : "Everything is configured."}
          </span>
        </span>
        <span className="text-xs font-semibold text-foreground/70">{open ? "Hide" : "Details"}</span>
      </button>
      {open && (
        <ul className="mt-3 divide-y divide-black/5 rounded-xl bg-card text-sm">
          {checks.map((check) => (
            <li key={check.key} className="flex items-start gap-3 px-4 py-3">
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", check.ok ? "bg-emerald-500" : check.level === "required" ? "bg-rose-500" : check.level === "recommended" ? "bg-amber-500" : "bg-zinc-300")} />
              <span className="min-w-0">
                <b className="block text-foreground">{check.label}</b>
                <span className="text-xs text-muted-foreground">{check.detail}</span>
              </span>
              <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{check.level}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type PlatformSession = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  impersonatedByUserId: string | null;
  user: { name: string; email: string; salon: { salonName: string } | null };
  impersonatedBy: { name: string; email: string } | null;
};

export const inputClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50";

export const outlineButtonClass =
  cn(buttonVariants({ variant: "outline" }), "h-9 gap-2 px-4 text-sm font-semibold");

export const buttonClass =
  cn(buttonVariants({ variant: "default" }), "h-9 gap-2 px-4 text-sm font-semibold shadow-xs");

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
  ARCHIVED: "border-border bg-muted/60 text-foreground/70",
};

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-transparent">
        <Image src="/logo.png" alt="DropXcutz logo" fill sizes="40px" className="object-cover" priority />
      </div>
      <div>
        <b className="text-base text-foreground font-bold">DropXCutz</b>
        <p className="text-xs text-muted-foreground font-medium">Super Admin Platform</p>
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
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
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
              ? "bg-primary text-white shadow-sm"
              : "text-foreground/80 hover:bg-muted/60"
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
    <div className="m-3 flex items-center gap-3 rounded-2xl border border-border bg-muted/60 p-3 shadow-sm">
      <b className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs text-white">
        SA
      </b>
      <div>
        <p className="text-sm font-bold text-foreground">Platform Admin</p>
        <p className="text-xs text-muted-foreground">Root authorization</p>
      </div>
      <button type="button" onClick={onLogout} title="Log out" className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
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
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Platform workspace</p>
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/60">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="mt-4 text-sm font-semibold text-foreground/70">Connecting to platform...</p>
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

export function ModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          data-slot="modal-overlay"
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
          className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-4 data-closed:animate-out data-closed:fade-out-0 sm:items-center sm:p-5 [&>*]:pointer-events-auto"
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className={tone === "danger" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}>
            <ShieldAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "destructive" : "default"} disabled={busy} onClick={onConfirm}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
      <b className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground/70">{label}</b>
      {children}
      {hint && <small className="mt-1 block text-xs text-muted-foreground">{hint}</small>}
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
    <Card className="gap-0 overflow-hidden py-0 shadow-sm ring-1 ring-border">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="mt-0.5 text-xs">{subtitle}</CardDescription>
        </div>
        {action && <CardAction className="static col-auto row-auto self-auto justify-self-auto">{action}</CardAction>}
      </CardHeader>
      {children}
    </Card>
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
      className={`grid h-10 w-10 shrink-0 place-items-center bg-muted/60 text-xs font-bold text-foreground/80 ${
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
    <Badge variant="outline" className={cn("h-5 gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide", tones[safe])}>
      <span className="size-1.5 rounded-full bg-current" />
      {safe}
    </Badge>
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
        <Search className="mx-auto h-8 w-8 text-muted-foreground" />
        <b className="mt-4 block font-bold text-foreground/80">{title}</b>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
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
      <div className="space-y-3 p-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  if (empty) return <Empty {...empty} />;
  return (
    <UiTable className="admin-table">
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          {head.map((x, i) => (
            <TableHead key={x + i} className="h-10 whitespace-nowrap px-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {x}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </UiTable>
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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background p-5">
      <div className="absolute h-[520px] w-[520px] rounded-full bg-primary/5 blur-3xl" />
      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onSubmit={onSubmit}
        onChange={clearError}
        className="relative w-full max-w-[440px] rounded-2xl bg-card p-8 shadow-xl ring-1 ring-border"
      >
        <Brand />
        <div className="mt-9">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Control Plane</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Platform Admin Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground">
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
  busy,
}: {
  overview: OverviewData | null;
  onViewSalons: () => void;
  onUpdateStatus: (salonId: string, status: Status) => void;
  busy?: boolean;
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
            className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow transition"
          >
            <div className="flex justify-between items-start">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted/60 text-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </section>

      {overview?.trends && <TrendCharts trends={overview.trends} />}

      <section className="grid gap-6 xl:grid-cols-[1.6fr_.8fr]">
        <Panel
          title="Recent Salon Workspaces"
          subtitle="Latest salon accounts on the platform"
          action={
            <button
              onClick={onViewSalons}
              className="text-xs font-bold uppercase tracking-wider text-foreground hover:underline"
            >
              View all ({metrics.totalSalons})
            </button>
          }
        >
          <div className="divide-y divide-border">
            {salons.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={s.salonName} />
                  <div className="min-w-0 flex-1">
                    <b className="text-sm text-foreground block truncate">{s.salonName}</b>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono text-foreground/80">{s.code}</span> • {s.city || "Location pending"} • {s.subscriptionPlan}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={s.status} />
                  <div className="flex gap-1">
                    {s.status !== "ACTIVE" && (
                      <button
                        disabled={busy}
                        onClick={() => onUpdateStatus(s.id, "ACTIVE")}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:pointer-events-none"
                        title="Activate Salon"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {s.status !== "SUSPENDED" && (
                      <button
                        disabled={busy}
                        onClick={() => onUpdateStatus(s.id, "SUSPENDED")}
                        className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:pointer-events-none"
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
                <p className="text-3xl font-bold text-foreground">{rate}%</p>
                <p className="text-xs text-muted-foreground">Active Workspaces Ratio</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                {metrics.activeSalons} of {metrics.totalSalons} Active
              </span>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm">
                <span className="text-foreground/70 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                </span>
                <b className="text-foreground font-bold">{metrics.activeSalons}</b>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm">
                <span className="text-foreground/70 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> On Trial
                </span>
                <b className="text-foreground font-bold">{metrics.trialSalons}</b>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm">
                <span className="text-foreground/70 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Suspended
                </span>
                <b className="text-foreground font-bold">{metrics.suspendedSalons}</b>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm">
                <span className="text-foreground/70 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Total Users
                </span>
                <b className="text-foreground font-bold">{metrics.totalUsers}</b>
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
  onImpersonate,
  busy,
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
  onImpersonate: (salon: Salon) => void;
  busy?: boolean;
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
            className="flex min-h-28 items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border transition-shadow hover:shadow-[0_16px_35px_-20px_rgba(37,99,235,0.3)]"
          >
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{hint}</p>
            </div>
          </motion.article>
        ))}
      </section>

    <Panel
      title="Salon Workspaces Directory"
      subtitle={`${total} salons configured across platform`}
      action={
        <div className="flex items-center gap-2">
          <a
            href="/api/platform/salons.csv"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground/80 shadow-sm transition hover:border-border hover:bg-muted/60 active:scale-[0.98]"
          >
            Export CSV
          </a>
          <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-card px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98]">
            <Plus className="h-4 w-4" /> Add Salon
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/40 p-4 sm:px-6">
        <label className="relative block max-w-sm flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, email, city or plan..."
            className={`${inputClass} border-border py-3 pl-10 shadow-sm focus:border-blue-400 focus:ring-blue-500/10`}
          />
        </label>
        <div className="flex gap-1 rounded-xl bg-muted/60 p-1 text-xs font-semibold">
          {["ALL", "ACTIVE", "TRIAL", "SUSPENDED", "ARCHIVED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-1.5 transition ${
                statusFilter === tab
                  ? "bg-card text-blue-700 shadow-sm ring-1 ring-blue-100"
                  : "text-muted-foreground hover:text-foreground"
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
                  <b className="text-sm font-bold text-foreground">{s.salonName}</b>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono text-foreground/80">{s.code}</span> • {s.city || "Location pending"} • {s.email}
                  </p>
                </div>
              </div>
            </td>
            <td data-label="Plan" className="px-5 py-3.5">
              <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {s.subscriptionPlan}
              </span>
            </td>
            <td data-label="Customers" className="px-5 py-3.5 font-medium text-foreground/80">
              {s._count?.customers || 0}
            </td>
            <td data-label="Appointments" className="px-5 py-3.5 font-medium text-foreground/80">
              {s._count?.appointments || 0}
            </td>
            <td data-label="Revenue" className="px-5 py-3.5 font-bold text-foreground">
              {money(s.paidRevenue)}
            </td>
            <td data-label="Status" className="px-5 py-3.5">
              <StatusBadge value={s.status} />
            </td>
            <td data-label="Actions" className="px-5 py-3.5 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => onViewDetails(s)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {s.status !== "ARCHIVED" && <button
                  disabled={busy}
                  onClick={() => onEdit(s)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition disabled:opacity-40 disabled:pointer-events-none"
                  title="Edit Salon Profile"
                >
                  <Edit2 className="h-4 w-4" />
                </button>}
                {s.status === "ARCHIVED" ? (
                  <button
                    disabled={busy}
                    onClick={() => onRestore(s)}
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-40 disabled:pointer-events-none"
                    title="Restore Salon as Suspended"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                ) : s.status === "ACTIVE" ? (
                  <button
                    disabled={busy}
                    onClick={() => onUpdateStatus(s.id, "SUSPENDED")}
                    className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition disabled:opacity-40 disabled:pointer-events-none"
                    title="Suspend Salon"
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => onUpdateStatus(s.id, "ACTIVE")}
                    className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-40 disabled:pointer-events-none"
                    title="Activate Salon"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {(s.status === "ACTIVE" || s.status === "TRIAL") && (
                  <button
                    disabled={busy}
                    onClick={() => onImpersonate(s)}
                    className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-40 disabled:pointer-events-none"
                    title="Log in as this salon's admin"
                  >
                    <LogIn className="h-4 w-4" />
                  </button>
                )}
                {s.status !== "ARCHIVED" && <button
                  disabled={busy}
                  onClick={() => onDelete(s)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-40 disabled:pointer-events-none"
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
            <tr key={x.id} className="hover:bg-muted/40 transition">
              <td data-label="Salon" className="px-5 py-4">
                <b>{x.salonName}</b>
                <p className="text-xs text-muted-foreground font-mono">{x.code}</p>
              </td>
              <td data-label="Plan" className="px-5 py-4">
                <select
                  value={x.subscriptionPlan}
                  onChange={(e) => onUpgradePlan(x, e.target.value)}
                  className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs font-semibold text-foreground/80 outline-none transition hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
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
                  <span className="text-xs text-foreground/80 font-medium block">{date(x.trialEndsAt)}</span>
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
              <td data-label="Started" className="px-5 py-4 text-xs text-muted-foreground">
                {date(x.createdAt)}
              </td>
              <td data-label="Actions" className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onExtendTrial(x)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground/80 hover:bg-muted/60 transition"
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
  onRevokeSessions,
  busy,
}: {
  items: PlatformUser[];
  loading: boolean;
  onToggle: (u: PlatformUser) => void;
  onCreateUser: () => void;
  onResetPassword: (u: PlatformUser) => void;
  roles: { id: string; name: string }[];
  onAssignPlatformRole: (user: PlatformUser, platformRoleId: string | null) => void;
  onRevokeSessions: (u: PlatformUser) => void;
  busy?: boolean;
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
      <div className="border-b border-border p-4 sm:px-6 bg-muted/40">
        <label className="relative block max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
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
          <tr key={u.id} className="hover:bg-muted/40 transition">
            <td data-label="User" className="px-5 py-4">
              <div className="flex gap-3 items-center">
                <Avatar name={u.name} round />
                <div>
                  <b className="text-sm font-bold text-foreground">{u.name}</b>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
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
                {String(u.role ?? "Unknown").replaceAll("_", " ")}
              </span>
              {u.role === "PLATFORM_ADMIN" && <select value={u.platformRole?.id ?? ""} onChange={(event) => onAssignPlatformRole(u, event.target.value || null)} className="mt-2 block h-8 rounded-lg border border-input bg-card px-2 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/30"><option value="">Legacy full access</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>}
            </td>
            <td data-label="Workspace" className="px-5 py-4 text-sm text-foreground/80">
              {u.salon ? (
                <div>
                  <span className="font-semibold">{u.salon.salonName}</span>
                  <span className="block text-xs text-muted-foreground font-mono">{u.salon.code}</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                  Platform Wide
                </span>
              )}
            </td>
            <td data-label="Status" className="px-5 py-4">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  u.active ? "bg-emerald-100 text-emerald-800" : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {u.active ? "Active" : "Disabled"}
              </span>
            </td>
            <td data-label="Actions" className="px-5 py-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  disabled={busy}
                  onClick={() => onResetPassword(u)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground/80 hover:bg-muted/60 transition disabled:opacity-40 disabled:pointer-events-none"
                  title="Reset Password"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Reset Pass
                </button>
                <button
                  disabled={busy}
                  onClick={() => onRevokeSessions(u)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground/80 hover:bg-muted/60 transition disabled:opacity-40 disabled:pointer-events-none"
                  title="Force-logout all active sessions"
                >
                  <LogOut className="h-3.5 w-3.5" /> Revoke Sessions
                </button>
                <button
                  disabled={busy}
                  onClick={() => onToggle(u)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-40 disabled:pointer-events-none ${
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
const domainTone: Record<PlatformWebsite["domainStatus"], string> = {
  NONE: "bg-muted text-muted-foreground",
  PENDING_DNS: "bg-amber-100 text-amber-800",
  VERIFYING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

export function WebsitesView({
  items,
  loading,
  busy,
  onManage,
  onUnpublish,
  onVerify,
  checks,
}: {
  items: PlatformWebsite[];
  checks?: SystemCheck[] | null;
  loading: boolean;
  busy?: boolean;
  onManage: (salonId: string) => void;
  onUnpublish: (site: PlatformWebsite) => void;
  onVerify: (site: PlatformWebsite) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  // Older settings rows can be incomplete. Normalize API data at the UI
  // boundary so one missing optional value cannot crash the whole panel.
  const websites = items.map((site) => ({
    ...site,
    salonName: site.salonName ?? "Unnamed salon",
    slug: site.slug ?? "",
    type: site.type ?? "NONE",
    domainStatus: site.domainStatus ?? "NONE",
  }));
  const shown = websites.filter((site) => {
    const q = query.trim().toLowerCase();
    const matches = !q || site.salonName.toLowerCase().includes(q) || site.slug.includes(q) || (site.customDomain ?? "").includes(q);
    const state = filter === "all" || (filter === "live" && site.isPublished) || (filter === "draft" && !site.isPublished && site.type !== "NONE") || (filter === "domain" && site.domainStatus !== "NONE" && site.domainStatus !== "ACTIVE");
    return matches && state;
  });
  const live = websites.filter((site) => site.isPublished).length;
  const statusCard = <SystemStatusCard checks={checks ?? null} />;
  const attention = websites.filter((site) => site.domainStatus === "FAILED" || site.domainStatus === "PENDING_DNS").length;
  return (
    <div className="space-y-5">
    {statusCard}
    <Panel title="Salon websites" subtitle={`${live} live · ${websites.length} configured · ${attention} domain${attention === 1 ? "" : "s"} need attention`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 p-4 sm:px-6">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search salon, address or domain…" aria-label="Search websites" className={`${inputClass} pl-10`} />
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter websites" className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-semibold outline-none">
          <option value="all">All sites</option>
          <option value="live">Live</option>
          <option value="draft">Drafts</option>
          <option value="domain">Domain issues</option>
        </select>
      </div>
      <Table
        head={["Salon", "Type", "Status", "Address", "Domain", ""]}
        loading={loading}
        empty={!shown.length ? { title: "No websites", message: websites.length ? "No sites match this filter." : "Websites appear here once a salon sets one up." } : undefined}
      >
        {shown.map((site) => (
          <tr key={site.salonId} className="transition hover:bg-muted/40">
            <td data-label="Salon" className="px-5 py-4">
              <b className="block text-sm text-foreground">{site.salonName}</b>
              <span className="text-xs text-muted-foreground">{site.slug}</span>
            </td>
            <td data-label="Type" className="px-5 py-4 text-xs font-semibold capitalize text-foreground/80">{site.type.toLowerCase()}</td>
            <td data-label="Status" className="px-5 py-4">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${site.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{site.isPublished ? "Live" : "Draft"}</span>
            </td>
            <td data-label="Address" className="px-5 py-4 text-xs">
              {site.liveUrl ? <a className="text-primary underline" href={site.liveUrl} target="_blank" rel="noopener noreferrer">{site.liveUrl.replace(/^https?:\/\//, "")}</a> : <span className="text-muted-foreground">—</span>}
            </td>
            <td data-label="Domain" className="px-5 py-4 text-xs">
              {site.customDomain ? (
                <span title={site.domainError ?? undefined}>
                  <span className="mr-2">{site.customDomain}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${domainTone[site.domainStatus]}`}>{site.domainStatus.replace("_", " ").toLowerCase()}</span>
                </span>
              ) : <span className="text-muted-foreground">—</span>}
            </td>
            <td data-label="Actions" className="px-5 py-4 text-right">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {site.customDomain && site.domainStatus !== "ACTIVE" && (
                  <button type="button" disabled={busy} onClick={() => onVerify(site)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground/80 hover:bg-muted disabled:pointer-events-none disabled:opacity-40">Check DNS</button>
                )}
                {site.isPublished && (
                  <button type="button" disabled={busy} onClick={() => onUnpublish(site)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:pointer-events-none disabled:opacity-40">Unpublish</button>
                )}
                <button type="button" disabled={busy} onClick={() => onManage(site.salonId)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground/80 hover:bg-muted disabled:pointer-events-none disabled:opacity-40">Manage</button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
    </div>
  );
}

export function SessionsView({
  items,
  loading,
  onRevoke,
  busy,
}: {
  items: PlatformSession[];
  loading: boolean;
  onRevoke: (session: PlatformSession) => void;
  busy?: boolean;
}) {
  const [impersonatedOnly, setImpersonatedOnly] = useState(true);
  const filtered = impersonatedOnly
    ? items.filter((s) => s.impersonatedByUserId)
    : items;

  return (
    <Panel
      title="Active Sessions"
      subtitle="Live logins across the platform, including support impersonation sessions"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 sm:px-6 bg-muted/40">
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground/70">
          <input
            type="checkbox"
            checked={impersonatedOnly}
            onChange={(e) => setImpersonatedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Show impersonation sessions only
        </label>
      </div>
      <Table
        head={["User", "Salon", "Impersonated By", "Started", "Expires", "IP", ""]}
        loading={loading}
        empty={
          !filtered.length
            ? {
                title: impersonatedOnly ? "No active impersonation sessions" : "No active sessions",
                message: impersonatedOnly
                  ? "Support sessions started via impersonation will appear here while they're live."
                  : "Signed-in sessions will appear here.",
              }
            : undefined
        }
      >
        {filtered.map((s) => (
          <tr key={s.id} className="hover:bg-muted/40 transition">
            <td data-label="User" className="px-5 py-4">
              <b className="text-xs font-bold text-foreground block">{s.user.name}</b>
              <span className="text-[11px] text-muted-foreground">{s.user.email}</span>
            </td>
            <td data-label="Salon" className="px-5 py-4 text-xs text-foreground/70">
              {s.user.salon?.salonName || "—"}
            </td>
            <td data-label="Impersonated By" className="px-5 py-4">
              {s.impersonatedBy ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                  <ShieldAlert className="h-3 w-3" />
                  {s.impersonatedBy.name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </td>
            <td data-label="Started" className="px-5 py-4 text-xs text-muted-foreground">
              {new Date(s.createdAt).toLocaleString("en-IN")}
            </td>
            <td data-label="Expires" className="px-5 py-4 text-xs text-muted-foreground">
              {new Date(s.expiresAt).toLocaleString("en-IN")}
            </td>
            <td data-label="IP" className="px-5 py-4 font-mono text-xs text-muted-foreground">
              {s.ipAddress || "—"}
            </td>
            <td data-label="Actions" className="px-5 py-4 text-right">
              <button
                type="button"
                disabled={busy}
                onClick={() => onRevoke(s)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:pointer-events-none"
              >
                Revoke
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}

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
    <Panel
      title="Platform Activity Audit Trail"
      subtitle="Chronological record of changes and events"
      action={
        <a
          href="/api/platform/audit-log.csv"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground/80 shadow-sm transition hover:border-border hover:bg-muted/60 active:scale-[0.98]"
        >
          Export CSV
        </a>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 sm:px-6 bg-muted/40">
        <label className="relative block max-w-sm flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
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
          className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-semibold outline-none transition focus-visible:ring-3 focus-visible:ring-ring/30"
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
          <tr key={x.id} className="hover:bg-muted/40 transition">
            <td data-label="Actor" className="px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 grid place-items-center rounded-full bg-primary text-white text-[10px] font-bold">
                  {(x.actor?.name || "AD").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <b className="text-xs font-bold text-foreground block">{x.actor?.name || "System Admin"}</b>
                  <span className="text-[11px] text-muted-foreground">{x.actor?.email || "system@dropxcutz.com"}</span>
                </div>
              </div>
            </td>
            <td data-label="Action" className="px-5 py-4 font-semibold text-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1 text-xs font-mono font-bold text-foreground/80">
                <FileClock className="h-3 w-3 text-muted-foreground" />
                {x.action}
              </span>
            </td>
            <td data-label="Entity" className="px-5 py-4 text-xs font-semibold text-foreground/70">
              {x.entity}
            </td>
            <td data-label="Reference" className="px-5 py-4 font-mono text-xs text-muted-foreground">
              {x.entityId || "—"}
            </td>
            <td data-label="Timestamp" className="px-5 py-4 text-xs text-muted-foreground">
              {new Date(x.createdAt).toLocaleString("en-IN")}
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
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
    return <div className="h-64 animate-pulse rounded-2xl bg-muted/60" />;

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
        <div className="flex justify-end border-t border-border bg-muted/60 p-4 sm:px-6">
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
    <ModalOverlay onClose={onClose}>
      <form
        onSubmit={onSubmit}
        role="dialog"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl border border-border"
      >
        <header className="flex justify-between items-center border-b p-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">New Workspace</p>
            <h2 className="text-xl font-bold text-foreground">Add Salon Workspace</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>
        <div className="overflow-y-auto p-5 sm:px-7 space-y-6">
          <div>
            <b className="text-sm font-bold text-foreground block mb-3">Salon Identity & Location</b>
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

          <div className="border-t border-border pt-5">
            <b className="text-sm font-bold text-foreground block mb-3">Initial Administrator Account</b>
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
                      className="shrink-0 rounded-xl border border-border bg-muted/60 px-3.5 py-2.5 text-xs font-semibold text-foreground/80 hover:bg-muted/60"
                    >
                      Generate New
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-3 border-t bg-muted/60 p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className={outlineButtonClass}
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Creating..." : "Create Salon Workspace"}
          </button>
        </footer>
      </form>
    </ModalOverlay>
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
    <ModalOverlay onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(salon.id, form);
        }}
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl border border-border"
      >
        <header className="flex justify-between items-center border-b p-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Edit Salon</p>
            <h2 className="text-xl font-bold text-foreground">{salon.salonName}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-muted-foreground" />
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
        <footer className="flex justify-end gap-3 border-t bg-muted/60 p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className={outlineButtonClass}
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </footer>
      </form>
    </ModalOverlay>
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
    <ModalOverlay onClose={onClose}>
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
        className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl border border-border"
      >
        <header className="flex justify-between items-center border-b p-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Security & Credentials</p>
            <h2 className="text-xl font-bold text-foreground">Add Administrator User</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-muted-foreground" />
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
        <footer className="flex justify-end gap-3 border-t bg-muted/60 p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className={outlineButtonClass}
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Creating..." : "Create User"}
          </button>
        </footer>
      </form>
    </ModalOverlay>
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
    <ModalOverlay onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(user.id, password);
        }}
        className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl border border-border"
      >
        <header className="flex justify-between items-center border-b p-5">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Password Reset</p>
            <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            Set a new master password for <b className="text-foreground">{user.email}</b>.
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
        <footer className="flex justify-end gap-3 border-t bg-muted/60 p-4">
          <button
            type="button"
            onClick={onClose}
            className={outlineButtonClass}
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </footer>
      </form>
    </ModalOverlay>
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
    <ModalOverlay onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(subscription.id, targetDate);
        }}
        className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl border border-border"
      >
        <header className="flex justify-between items-center border-b p-5">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Trial Extension</p>
            <h2 className="text-lg font-bold text-foreground">{subscription.salonName}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-muted-foreground" />
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
                className="flex-1 rounded-lg border border-border bg-muted/60 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted/60"
              >
                +{days} Days
              </button>
            ))}
          </div>
        </div>
        <footer className="flex justify-end gap-3 border-t bg-muted/60 p-4">
          <button
            type="button"
            onClick={onClose}
            className={outlineButtonClass}
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Saving..." : "Set Expiry Date"}
          </button>
        </footer>
      </form>
    </ModalOverlay>
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
    <ModalOverlay onClose={onClose}>
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl border border-border">
        <header className="flex justify-between items-center border-b p-5 sm:px-7">
          <div className="flex items-center gap-3">
            <Avatar name={salon.salonName} />
            <div>
              <h2 className="text-xl font-bold text-foreground">{salon.salonName}</h2>
              <p className="text-xs text-muted-foreground font-mono">{salon.code} • {salon.city || "Location pending"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:opacity-70">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>
        <div className="overflow-y-auto p-5 sm:px-7 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/60 p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Paid Revenue</p>
              <p className="text-xl font-bold text-foreground mt-1">{money(salon.paidRevenue)}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Clients</p>
              <p className="text-xl font-bold text-foreground mt-1">{salon._count?.customers || 0}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Appointments</p>
              <p className="text-xl font-bold text-foreground mt-1">{salon._count?.appointments || 0}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <b className="font-bold text-foreground block border-b border-border pb-2">Workspace Information</b>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Legal Entity:</span>
              <span className="font-semibold text-foreground">{salon.legalName || "—"}</span>
              <span className="text-muted-foreground">Official Email:</span>
              <span className="font-semibold text-foreground">{salon.email}</span>
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-semibold text-foreground">{salon.phone || "—"}</span>
              <span className="text-muted-foreground">Subscription Tier:</span>
              <span className="font-semibold text-foreground">{salon.subscriptionPlan}</span>
              <span className="text-muted-foreground">Current Status:</span>
              <span><StatusBadge value={salon.status} /></span>
              <span className="text-muted-foreground">Created At:</span>
              <span className="text-foreground/80">{date(salon.createdAt)}</span>
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-3 border-t bg-muted/60 p-4 sm:px-7">
          <button onClick={onManage} className={outlineButtonClass}>Open salon workspace</button>
          <button
            onClick={onClose}
            className={buttonClass}
          >
            Close
          </button>
        </footer>
      </div>
    </ModalOverlay>
  );
}
