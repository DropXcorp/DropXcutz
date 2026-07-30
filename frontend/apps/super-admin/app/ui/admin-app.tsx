"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  FullPageLoader,
  Navigation,
  Notice,
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
const copy: Record<Section, string> = {
  Overview: "A live view of your platform performance and account health.",
  Salons: "Manage every salon workspace from one place.",
  Users: "Review access and manage administrator accounts.",
  Subscriptions: "Track plans, trials and account status.",
  "Audit Log": "A chronological record of platform activity.",
  Settings: "Configure security and platform-wide defaults.",
};
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    }),
    b = (await r.json().catch(() => ({}))) as { data?: T; error?: string };
  if (!r.ok) throw new Error(b.error ?? "Request failed.");
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
    [create, setCreate] = useState(false);
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
    if (!auth || section === "Overview" || section === "Salons") {
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
  async function createSalon(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget,
      f = new FormData(el),
      p = {
        code: String(f.get("code")),
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
      el.reset();
      setCreate(false);
      setSuccess(`${p.salonName} was added successfully.`);
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="p-6 pb-3">
          <Brand />
        </div>
        <Navigation items={nav} section={section} choose={choose} />
        <SidebarFooter />
      </aside>
      {mobile && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden"
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
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobile(true)} className="lg:hidden">
                <Menu />
              </button>
              <div>
                <p className="text-xs text-slate-400">Workspace / {section}</p>
                <h1 className="text-xl font-bold">{section}</h1>
              </div>
            </div>
            {(section === "Overview" || section === "Salons") && (
              <button onClick={() => setCreate(true)} className={buttonClass}>
                <Plus className="h-4 w-4" />
                Add salon
              </button>
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
                onCreate={() => setCreate(true)}
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
        />
      )}
    </main>
  );
}
