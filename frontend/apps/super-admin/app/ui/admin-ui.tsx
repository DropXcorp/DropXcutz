import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  FileClock,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
export type Status = "TRIAL" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type Salon = {
  id: string;
  code: string;
  salonName: string;
  email: string;
  city: string | null;
  status: Status;
  subscriptionPlan: string;
  createdAt: string;
  paidRevenue: number;
  _count: { customers: number; appointments: number };
};
export type Subscription = {
  id: string;
  salonName: string;
  code: string;
  subscriptionPlan: string;
  status: Status;
  trialEndsAt: string | null;
  createdAt: string;
};
export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  salon: { salonName: string } | null;
};
export type AuditItem = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
};
export type SettingsData = {
  platformName: string;
  supportEmail: string | null;
  defaultTrialDays: number;
  sessionHours: number;
  passwordMinimumLength: number;
};
export type Section =
  | "Overview"
  | "Salons"
  | "Users"
  | "Subscriptions"
  | "Audit Log"
  | "Settings";
export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60";
const money = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
const date = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
        new Date(v),
      )
    : "Not set";
const tones: Record<Status, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  TRIAL: "border-amber-200 bg-amber-50 text-amber-700",
  SUSPENDED: "border-rose-200 bg-rose-50 text-rose-700",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-600",
};
export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <b>DropXCutz</b>
        <p className="text-xs text-slate-500">Super admin</p>
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
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        Manage
      </p>
      {items.map(([Icon, label]) => (
        <button
          key={label}
          onClick={() => choose(label)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${section === label ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <Icon className="h-[18px] w-[18px]" />
          {label}
          {section === label && (
            <i className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
          )}
        </button>
      ))}
    </nav>
  );
}
export function SidebarFooter() {
  return (
    <div className="m-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <b className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs text-white">
        SA
      </b>
      <div>
        <p className="text-sm font-semibold">Super Admin</p>
        <p className="text-xs text-slate-500">Platform access</p>
      </div>
      <ShieldCheck className="ml-auto h-4 w-4 text-emerald-600" />
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
    <div>
      <h2 className="text-2xl font-bold tracking-tight sm:text-[28px]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
export function FullPageLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        <p className="mt-4 text-sm text-slate-500">Loading your workspace?</p>
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
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}
    >
      {ok ? <Check className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
function Field({
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
      <b className="mb-2 block text-sm text-slate-700">{label}</b>
      {children}
      {hint && <small className="mt-1 block text-slate-400">{hint}</small>}
    </label>
  );
}
function Input({
  label,
  hint,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input required className={inputClass} {...p} />
    </Field>
  );
}
function Panel({
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
function Avatar({ name, round = false }: { name: string; round?: boolean }) {
  const s = name
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
  return (
    <b
      className={`grid h-10 w-10 shrink-0 place-items-center bg-indigo-50 text-sm text-indigo-700 ${round ? "rounded-full" : "rounded-xl"}`}
    >
      {s}
    </b>
  );
}
function Status({ value }: { value?: Status }) {
  const safe = value && value in tones ? value : "ARCHIVED";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[safe]}`}
    >
      {safe.charAt(0) + safe.slice(1).toLowerCase()}
    </span>
  );
}
function Empty({
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
        <Search className="mx-auto h-6 w-6 text-slate-300" />
        <b className="mt-4 block">{title}</b>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
function Table({
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
      <div className="animate-pulse p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-4 h-12 rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  if (empty) return <Empty {...empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="admin-table min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {head.map((x) => (
              <th key={x} className="px-5 py-3.5">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 p-5">
      <div className="absolute h-[520px] w-[520px] rounded-full bg-indigo-600/25 blur-3xl" />
      <form
        onSubmit={onSubmit}
        onChange={clearError}
        className="relative w-full max-w-[440px] rounded-3xl bg-white p-8 shadow-2xl"
      >
        <Brand />
        <div className="mt-9">
          <p className="text-sm font-semibold text-indigo-600">Welcome back</p>
          <h1 className="mt-1 text-3xl font-bold">Sign in to your workspace</h1>
          <p className="mt-2 text-sm text-slate-500">
            Use your platform administrator credentials to continue.
          </p>
        </div>
        {error && (
          <div className="mt-5">
            <Notice type="error" message={error} onClose={clearError} />
          </div>
        )}
        <div className="mt-6 space-y-4">
          <Field label="Email address">
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              className={inputClass}
            />
          </Field>
          <Field label="Password">
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
            />
          </Field>
          <button disabled={submitting} className={`${buttonClass} w-full`}>
            {submitting ? "Signing in?" : "Sign in"}
          </button>
        </div>
      </form>
    </main>
  );
}
export function Overview({
  salons,
  active,
  appointments,
  revenue,
  onViewSalons,
}: {
  salons: Salon[];
  active: number;
  appointments: number;
  revenue: number;
  onViewSalons: () => void;
}) {
  const customers = salons.reduce((n, s) => n + s._count.customers, 0),
    rate = salons.length ? Math.round((active / salons.length) * 100) : 0;
  const cards = [
    [Building2, "Total salons", salons.length],
    [Users, "Total customers", customers],
    [CalendarDays, "Appointments", appointments],
    [CircleDollarSign, "Platform revenue", money(revenue)],
  ] as const;
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([Icon, label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div className="metric-icon">
                <Icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.6fr_.8fr]">
        <Panel
          title="Recent salons"
          subtitle="Latest workspaces added"
          action={
            <button
              onClick={onViewSalons}
              className="text-sm font-semibold text-indigo-600"
            >
              View all
            </button>
          }
        >
          <div className="divide-y divide-slate-100">
            {salons.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-4">
                <Avatar name={s.salonName} />
                <div className="min-w-0 flex-1">
                  <b className="text-sm">{s.salonName}</b>
                  <p className="text-xs text-slate-500">
                    {s.code} ? {s.city || "Location pending"}
                  </p>
                </div>
                <Status value={s.status} />
              </div>
            ))}
            {!salons.length && (
              <Empty
                title="No salons yet"
                message="Add your first salon to begin."
              />
            )}
          </div>
        </Panel>
        <Panel title="Platform health" subtitle="Account status at a glance">
          <div className="p-6">
            <p className="text-3xl font-bold">{rate}%</p>
            <p className="text-sm text-slate-500">Active workspace rate</p>
            <div className="mt-5 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className="mt-6 space-y-3">
              <Health label="Active" value={active} />
              <Health
                label="On trial"
                value={salons.filter((s) => s.status === "TRIAL").length}
              />
              <Health
                label="Needs attention"
                value={salons.filter((s) => s.status === "SUSPENDED").length}
              />
            </div>
          </div>
        </Panel>
      </section>
    </>
  );
}
function Health({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex rounded-xl bg-slate-50 p-3 text-sm">
      <span className="flex-1 text-slate-600">{label}</span>
      <b>{value}</b>
    </div>
  );
}
export function SalonsView({
  salons,
  total,
  loading,
  search,
  setSearch,
  onCreate,
}: {
  salons: Salon[];
  total: number;
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  onCreate: () => void;
}) {
  return (
    <Panel
      title="Salon directory"
      subtitle={`${total} workspaces on the platform`}
    >
      <div className="border-b border-slate-100 p-4 sm:px-6">
        <label className="relative block max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, city or plan?"
            className={`${inputClass} pl-10`}
          />
        </label>
      </div>
      <Table
        head={[
          "Salon",
          "Plan",
          "Customers",
          "Appointments",
          "Revenue",
          "Status",
        ]}
        loading={loading}
        empty={
          !salons.length
            ? {
                title: search ? "No matching salons" : "No salons yet",
                message: search
                  ? "Try a different search."
                  : "Create a salon to begin.",
                action: !search && (
                  <button onClick={onCreate} className={buttonClass}>
                    <Plus className="h-4 w-4" />
                    Add salon
                  </button>
                ),
              }
            : undefined
        }
      >
        {salons.map((s) => (
          <tr key={s.id}>
            <td data-label="Salon" className="px-5 py-4">
              <div className="flex gap-3">
                <Avatar name={s.salonName} />
                <div>
                  <b>{s.salonName}</b>
                  <p className="text-xs text-slate-500">
                    {s.code} ? {s.city || "Location pending"}
                  </p>
                </div>
              </div>
            </td>
            <td data-label="Plan" className="px-5 py-4">
              {s.subscriptionPlan}
            </td>
            <td data-label="Customers" className="px-5 py-4">
              {s._count.customers}
            </td>
            <td data-label="Appointments" className="px-5 py-4">
              {s._count.appointments}
            </td>
            <td data-label="Revenue" className="px-5 py-4 font-semibold">
              {money(s.paidRevenue)}
            </td>
            <td data-label="Status" className="px-5 py-4">
              <Status value={s.status} />
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
export function SubscriptionsView({
  items,
  loading,
}: {
  items: Subscription[];
  loading: boolean;
}) {
  return (
    <Panel
      title="Subscription overview"
      subtitle="Plans, status and trial dates"
    >
      <Table
        head={["Salon", "Plan", "Status", "Trial ends", "Started"]}
        loading={loading}
        empty={
          !items.length
            ? {
                title: "No subscriptions",
                message: "Records will appear here.",
              }
            : undefined
        }
      >
        {items.map((x) => (
          <tr key={x.id}>
            <td data-label="Salon" className="px-5 py-4">
              <b>{x.salonName}</b>
              <p className="text-xs text-slate-500">{x.code}</p>
            </td>
            <td data-label="Plan" className="px-5 py-4">
              {x.subscriptionPlan}
            </td>
            <td data-label="Status" className="px-5 py-4">
              <Status value={x.status} />
            </td>
            <td data-label="Trial ends" className="px-5 py-4">
              {date(x.trialEndsAt)}
            </td>
            <td data-label="Started" className="px-5 py-4">
              {date(x.createdAt)}
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
export function UsersView({
  items,
  loading,
  onToggle,
}: {
  items: PlatformUser[];
  loading: boolean;
  onToggle: (u: PlatformUser) => void;
}) {
  return (
    <Panel title="User access" subtitle="Platform and salon administrators">
      <Table
        head={["User", "Role", "Workspace", "Status", "Action"]}
        loading={loading}
        empty={
          !items.length
            ? { title: "No users", message: "Accounts will appear here." }
            : undefined
        }
      >
        {items.map((u) => (
          <tr key={u.id}>
            <td data-label="User" className="px-5 py-4">
              <div className="flex gap-3">
                <Avatar name={u.name} round />
                <div>
                  <b>{u.name}</b>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
            </td>
            <td data-label="Role" className="px-5 py-4 capitalize">
              {String(u.role ?? "Unknown")
                .replaceAll("_", " ")
                .toLowerCase()}
            </td>
            <td data-label="Workspace" className="px-5 py-4">
              {u.salon?.salonName || "Platform"}
            </td>
            <td data-label="Status" className="px-5 py-4">
              {u.active ? "Active" : "Inactive"}
            </td>
            <td data-label="Action" className="px-5 py-4">
              <button
                onClick={() => onToggle(u)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
              >
                {u.active ? "Disable" : "Enable"}
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
  return (
    <Panel title="Activity history" subtitle="Recent platform changes">
      <Table
        head={["Action", "Entity", "Reference", "Date"]}
        loading={loading}
        empty={
          !items.length
            ? {
                title: "No activity",
                message: "Changes will be recorded here.",
              }
            : undefined
        }
      >
        {items.map((x) => (
          <tr key={x.id}>
            <td
              data-label="Action"
              className="px-5 py-4 font-semibold capitalize"
            >
              <FileClock className="mr-2 inline h-4 w-4 text-indigo-600" />
              {String(x.action ?? "Unknown action")
                .replaceAll("_", " ")
                .toLowerCase()}
            </td>
            <td data-label="Entity" className="px-5 py-4">
              {x.entity}
            </td>
            <td data-label="Reference" className="px-5 py-4 text-slate-500">
              {x.entityId || "?"}
            </td>
            <td data-label="Date" className="px-5 py-4">
              {date(x.createdAt)}
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
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
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;
  return (
    <form onSubmit={onSubmit}>
      <Panel
        title="Platform settings"
        subtitle="Identity, security and workspace defaults"
      >
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <Input
            name="platformName"
            label="Platform name"
            defaultValue={settings.platformName}
          />
          <Input
            name="supportEmail"
            label="Support email"
            type="email"
            defaultValue={settings.supportEmail || ""}
          />
          <Input
            name="defaultTrialDays"
            label="Default trial days"
            type="number"
            min={1}
            defaultValue={settings.defaultTrialDays}
          />
          <Input
            name="sessionHours"
            label="Session duration (hours)"
            type="number"
            min={1}
            defaultValue={settings.sessionHours}
          />
          <Input
            name="passwordMinimumLength"
            label="Minimum password length"
            type="number"
            min={8}
            defaultValue={settings.passwordMinimumLength}
          />
        </div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4">
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Saving?" : "Save changes"}
          </button>
        </div>
      </Panel>
    </form>
  );
}
export function CreateSalonModal({
  onSubmit,
  onClose,
  submitting,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  submitting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-5"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="flex justify-between border-b p-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase text-indigo-600">
              New workspace
            </p>
            <h2 className="text-xl font-bold">Add a salon</h2>
            <p className="text-sm text-slate-500">
              Create the workspace and its administrator.
            </p>
          </div>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="overflow-y-auto p-5 sm:px-7">
          <b>Salon details</b>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input name="salonName" label="Salon name" autoFocus />
            <Input name="code" label="Salon code" />
            <Input name="legalName" label="Legal name" />
            <Input name="phone" label="Phone" />
            <Input name="email" label="Salon email" type="email" />
            <Field label="Subscription plan">
              <select name="plan" className={inputClass}>
                <option>Starter</option>
                <option>Professional</option>
                <option>Enterprise</option>
              </select>
            </Field>
            <Input name="city" label="City" required={false} />
            <Input name="state" label="State" required={false} />
          </div>
          <hr className="my-6 border-slate-100" />
          <b>Administrator access</b>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input name="adminName" label="Administrator name" />
            <Input name="adminEmail" label="Administrator email" type="email" />
            <div className="sm:col-span-2">
              <Input
                name="adminPassword"
                label="Temporary password"
                type="password"
                minLength={12}
                hint="Use at least 12 characters."
              />
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-3 border-t bg-slate-50 p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button disabled={submitting} className={buttonClass}>
            {submitting ? "Creating?" : "Create salon"}
          </button>
        </footer>
      </form>
    </div>
  );
}
