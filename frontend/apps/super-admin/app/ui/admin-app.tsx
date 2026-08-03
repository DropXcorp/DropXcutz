"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  BarChart3,
  Building2,
  CreditCard,
  FileClock,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Users,
  X,
} from "lucide-react";
import {
  AuditView,
  Brand,
  CreateSalonModal,
  FinancialView,
  FullPageLoader,
  Navigation,
  Notice,
  NotificationView,
  Overview,
  SalonsView,
  SectionHeading,
  SettingsView,
  SidebarFooter,
  SignIn,
  SubscriptionsView,
  UsersView,
  buttonClass,
} from "./admin-ui";
import type {
  AuditItem,
  PlatformUser,
  Salon,
  Section,
  SettingsData,
  Subscription,
} from "./admin-ui";
const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const salonCode = (...values: Array<FormDataEntryValue | null>) => {
  for (const value of values) {
    const code = String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "");
    if (code) return code;
  }
  return "salon";
};
const generateTemporaryPassword = () => {
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const groups = [lowercase, uppercase, digits, symbols];
  const alphabet = groups.join("");
  const randomInt = (max: number) => {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi?.getRandomValues) {
      return cryptoApi.getRandomValues(new Uint32Array(1))[0] % max;
    }
    return Math.floor(Math.random() * max);
  };
  const pick = (chars: string) => chars[randomInt(chars.length)];
  return [
    ...groups.map(pick),
    ...Array.from({ length: 12 }, () => pick(alphabet)),
  ]
    .sort(() => randomInt(2 ** 32) - 2 ** 31)
    .join("");
};
const copy: Record<Section, string> = {
  Overview: "A live view of your platform performance and account health.",
  Salons: "Manage every salon workspace from one place.",
  Users: "Review access and manage administrator accounts.",
  Subscriptions: "Track plans, trials and account status.",
  "Audit Log": "A chronological record of platform activity.",
  Settings: "Configure security and platform-wide defaults.",
  Notifications: "Send announcements directly to ERP workspaces.",
  Financials: "Platform-wide revenue and operating performance.",
};
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    }),
    b = (await r.json().catch(() => ({}))) as {
      data?: T;
      error?: string;
      details?: Array<{ field?: string; message?: string }>;
    };
  if (!r.ok) {
    const details = b.details
      ?.map(
        (detail) =>
          `${detail.field || "request"}: ${detail.message || "invalid value"}`,
      )
      .join("; ");
    throw new Error(
      details
        ? `${b.error ?? "Request failed."} ${details}`
        : (b.error ?? "Request failed."),
    );
  }
  return b.data as T;
}
export default function AdminApp() {
  const [salons, setSalons] = useState<Salon[]>([]),
    [data, setData] = useState<unknown>(null),
    [section, setSection] = useState<Section>("Overview");
  const [auth, setAuth] = useState<boolean | null>(null),
    [loading, setLoading] = useState(true),
    [sectionLoading, setSectionLoading] = useState(false),
    [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [search, setSearch] = useState(""),
    [mobile, setMobile] = useState(false),
    [create, setCreate] = useState(false),
    [temporaryPassword, setTemporaryPassword] = useState(
      generateTemporaryPassword,
    );
  const load = useCallback(async () => {
    try {
      setSalons(await api<Salon[]>("/api/salons"));
      setAuth(true);
      setError("");
    } catch (e) {
      setAuth(false);
      setError(
        e instanceof Error ? e.message : "Could not load platform data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (
      !auth ||
      section === "Overview" ||
      section === "Salons" ||
      section === "Notifications" ||
      section === "Financials"
    ) {
      setData(null);
      return;
    }
    let active = true;
    setSectionLoading(true);
    setError("");
    void api(`/api/platform/${section.toLowerCase().replace(" ", "-")}`)
      .then((x) => {
        if (active) setData(x);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Could not load this section.",
          );
      })
      .finally(() => {
        if (active) setSectionLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth, section]);
  useEffect(() => {
    if (!create) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCreate(false);
    };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [create]);
  const visible = useMemo(
    () =>
      salons.filter((s) =>
        `${s.salonName} ${s.code} ${s.email} ${s.city} ${s.subscriptionPlan}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [salons, search],
  );
  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      setAuth(true);
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }
  function openCreate() {
    setTemporaryPassword(generateTemporaryPassword());
    setCreate(true);
  }
  async function createSalon(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget,
      f = new FormData(el),
      p = {
        code: salonCode(f.get("code"), f.get("salonName")),
        salonName: String(f.get("salonName")),
        legalName: String(f.get("legalName")),
        phone: String(f.get("phone")),
        email: String(f.get("email")),
        city: String(f.get("city")),
        state: String(f.get("state")),
        adminName: String(f.get("adminName")),
        adminEmail: String(f.get("adminEmail")),
        adminPassword: String(f.get("adminPassword")),
        subscriptionPlan: String(f.get("plan")),
        status: "TRIAL",
        gstin: "",
        logoUrl: "",
        website: "",
        address: "",
        postalCode: "",
        currency: "INR",
        locale: "en-IN",
        timezone: "Asia/Kolkata",
        taxRate: 18,
        invoicePrefix: "INV",
        openingTime: "09:00",
        closingTime: "20:00",
        appointmentSlotMinutes: 30,
        cancellationWindowHours: 4,
        allowOnlineBooking: true,
        lowStockAlerts: true,
        dailyRevenueDigest: true,
      };
    setSubmitting(true);
    setError("");
    try {
      await api("/api/salons", { method: "POST", body: JSON.stringify(p) });
      const erpUrl = process.env.NEXT_PUBLIC_ERP_URL ?? "http://localhost:3000";
      const credentials = [
        "DropXcutz salon admin login",
        `Salon: ${p.salonName}`,
        `Salon code: ${p.code}`,
        `ERP URL: ${erpUrl}`,
        `Email: ${p.adminEmail}`,
        `Password: ${p.adminPassword}`,
      ].join("\n");
      let copied = false;
      try {
        await navigator.clipboard.writeText(credentials);
        copied = true;
      } catch {}
      el.reset();
      setTemporaryPassword(generateTemporaryPassword());
      setCreate(false);
      setSuccess(
        `${p.salonName} was added successfully${copied ? " and the admin credentials were copied to your clipboard" : "; copy the admin credentials manually"}.`,
      );
      setSection("Salons");
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not create salon.");
    } finally {
      setSubmitting(false);
    }
  }
  async function saveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const x = await api<SettingsData>("/api/platform/settings", {
        method: "PUT",
        body: JSON.stringify({
          platformName: f.get("platformName"),
          supportEmail: f.get("supportEmail"),
          defaultTrialDays: Number(f.get("defaultTrialDays")),
          sessionHours: Number(f.get("sessionHours")),
          passwordMinimumLength: Number(f.get("passwordMinimumLength")),
        }),
      });
      setData(x);
      setSuccess("Platform settings saved.");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not save settings.");
    } finally {
      setSubmitting(false);
    }
  }
  async function sendNotification(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    setError("");
    try {
      const result = await api<{ count: number }>(
        "/api/platform/notifications",
        {
          method: "POST",
          body: JSON.stringify({
            salonId: form.get("salonId"),
            title: form.get("title"),
            message: form.get("message"),
          }),
        },
      );
      formElement.reset();
      setSuccess(
        `Notification sent to ${result.count} salon${result.count === 1 ? "" : "s"}.`,
      );
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not send notification.");
    } finally {
      setSubmitting(false);
    }
  }
  async function toggleUser(u: PlatformUser) {
    try {
      const x = await api<PlatformUser>(`/api/platform/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !u.active }),
      });
      setData(list<PlatformUser>(data).map((i) => (i.id === x.id ? x : i)));
      setSuccess(`${u.name} is now ${x.active ? "active" : "inactive"}.`);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not update user.");
    }
  }
  const nav = [
    [LayoutDashboard, "Overview"],
    [Building2, "Salons"],
    [Users, "Users"],
    [CreditCard, "Subscriptions"],
    [FileClock, "Audit Log"],
    [Settings, "Settings"],
    [Bell, "Notifications"],
    [BarChart3, "Financials"],
  ] as const;
  const choose = (s: Section) => {
    setSection(s);
    setMobile(false);
    setError("");
    setSuccess("");
  };
  if (auth === null) return <FullPageLoader />;
  if (!auth)
    return (
      <SignIn
        error={error}
        submitting={submitting}
        onSubmit={signIn}
        clearError={() => setError("")}
      />
    );
  const active = salons.filter((s) => s.status === "ACTIVE").length,
    appointments = salons.reduce((n, s) => n + s._count.appointments, 0),
    revenue = salons.reduce((n, s) => n + s.paidRevenue, 0);
  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
        <div className="p-6 pb-3">
          <Brand />
        </div>
        <Navigation items={nav} section={section} choose={choose} />
        <SidebarFooter />
      </aside>
      {mobile && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/40 lg:hidden"
          onClick={() => setMobile(false)}
        >
          <aside
            className="flex h-full w-72 flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between border-b p-5">
              <Brand />
              <button onClick={() => setMobile(false)}>
                <X />
              </button>
            </div>
            <Navigation items={nav} section={section} choose={choose} />
            <SidebarFooter />
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobile(true)} className="lg:hidden">
                <Menu />
              </button>
              <div>
                <p className="text-xs text-zinc-400">Workspace / {section}</p>
                <h1 className="text-xl font-bold">{section}</h1>
              </div>
            </div>
            {(section === "Overview" || section === "Salons") && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => choose("Notifications")}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  <Bell className="h-4 w-4" />
                  Send notification
                </button>
                <button onClick={openCreate} className={buttonClass}>
                  <Plus className="h-4 w-4" />
                  Add salon
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <SectionHeading title={section} subtitle={copy[section]} />
          <div className="mt-6 space-y-6">
            {error && (
              <Notice
                type="error"
                message={error}
                onClose={() => setError("")}
              />
            )}{" "}
            {success && (
              <Notice
                type="success"
                message={success}
                onClose={() => setSuccess("")}
              />
            )}{" "}
            {section === "Overview" && (
              <Overview
                salons={salons}
                active={active}
                appointments={appointments}
                revenue={revenue}
                onViewSalons={() => choose("Salons")}
              />
            )}{" "}
            {section === "Salons" && (
              <SalonsView
                salons={visible}
                total={salons.length}
                loading={loading}
                search={search}
                setSearch={setSearch}
                onCreate={openCreate}
              />
            )}{" "}
            {section === "Subscriptions" && (
              <SubscriptionsView
                items={list<Subscription>(data)}
                loading={sectionLoading}
              />
            )}{" "}
            {section === "Users" && (
              <UsersView
                items={list<PlatformUser>(data)}
                loading={sectionLoading}
                onToggle={toggleUser}
              />
            )}{" "}
            {section === "Audit Log" && (
              <AuditView
                items={list<AuditItem>(data)}
                loading={sectionLoading}
              />
            )}{" "}
            {section === "Financials" && <FinancialView salons={salons} />}{" "}
            {section === "Notifications" && (
              <NotificationView
                salons={salons}
                submitting={submitting}
                onSubmit={sendNotification}
              />
            )}{" "}
            {section === "Settings" && (
              <SettingsView
                settings={data as SettingsData | null}
                loading={sectionLoading}
                submitting={submitting}
                onSubmit={saveSettings}
              />
            )}
          </div>
        </div>
      </div>
      {create && (
        <CreateSalonModal
          onSubmit={createSalon}
          onClose={() => setCreate(false)}
          submitting={submitting}
          temporaryPassword={temporaryPassword}
          onTemporaryPasswordChange={setTemporaryPassword}
          onGeneratePassword={() =>
            setTemporaryPassword(generateTemporaryPassword())
          }
        />
      )}
    </main>
  );
}
