"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
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
  buttonClass,
  CreateSalonModal,
  CreateUserModal,
  EditSalonModal,
  ExtendTrialModal,
  FullPageLoader,
  Navigation,
  Notice,
  NotificationView,
  Overview,
  ResetPasswordModal,
  SalonDetailsModal,
  SalonsView,
  SectionHeading,
  SettingsView,
  SidebarFooter,
  SignIn,
  SubscriptionsView,
  UsersView,
} from "./admin-ui";
import { OperationsConsole } from "./operations-console";
import { ReportsConsole } from "./reports-console";
import type {
  AuditItem,
  OverviewData,
  PlatformUser,
  Salon,
  Section,
  SettingsData,
  Status,
  Subscription,
} from "./admin-ui";

const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
type Plan = { id: string; code: string; name: string; description?: string | null; monthlyPrice?: number | null; isActive: boolean; features?: { feature: { code: string; name: string } }[]; _count?: { subscriptions: number } };
type Feature = { id: string; code: string; name: string };
type SalonSubscription = { id: string; planId: string; status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED"; expiresAt: string | null } | null;
type Website = { type: "NONE" | "TEMPLATE" | "CUSTOM"; title?: string | null; description?: string | null; customDomain?: string | null } | null;

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
  Overview: "Live view of all salon workspaces, revenue and platform account health.",
  Salons: "Configure, activate, suspend, edit and monitor salon instances.",
  Users: "Manage platform super administrators and salon account credentials.",
  Subscriptions: "Track plans, trial expiration dates, and tier upgrades.",
  Plans: "Configure the feature bundles available to salon subscriptions.",
  "Audit Log": "Chronological audit trail of all platform-wide administrative actions.",
  Settings: "Configure security policies, session longevity, and platform defaults.",
  Notifications: "Broadcast system alerts directly into salon ERP dashboards.",
  Financials: "Platform-wide billing volume and per-salon revenue performance.",
  Operations: "Billing, support, access controls, security, and bulk salon updates.",
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (r.status === 204) return undefined as T;
  const b = (await r.json().catch(() => ({}))) as {
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
  return (b.data ?? b) as T;
}

export default function AdminApp() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [data, setData] = useState<unknown>(null);
  const [section, setSection] = useState<Section>("Overview");

  const [auth, setAuth] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLabel, setActionLabel] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [mobile, setMobile] = useState(false);

  // Modals state
  const [create, setCreate] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [viewingSalon, setViewingSalon] = useState<Salon | null>(null);
  const [managingSalon, setManagingSalon] = useState<Salon | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [extendingSubscription, setExtendingSubscription] = useState<Subscription | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<PlatformUser | null>(null);
  const [platformRoles, setPlatformRoles] = useState<Array<{ id: string; name: string }>>([]);

  const [temporaryPassword, setTemporaryPassword] = useState(generateTemporaryPassword);

  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } finally {
      setAuth(false);
      setOverview(null);
      setSalons([]);
      setData(null);
      setError("");
    }
  };

  const load = useCallback(async () => {
    try {
      const [salonList, overviewData] = await Promise.all([
        api<Salon[]>("/api/salons"),
        api<OverviewData>("/api/platform/overview").catch(() => null),
      ]);
      setSalons(salonList || []);
      if (overviewData) setOverview(overviewData);
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
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error || !auth) return;
    const timer = window.setTimeout(() => setError(""), 5000);
    return () => window.clearTimeout(timer);
  }, [error, auth]);

  useEffect(() => {
    if (!auth) return;

    if (section === "Overview") {
      setSectionLoading(true);
      api<OverviewData>("/api/platform/overview")
        .then((res) => {
          setOverview(res);
          if (res.salons) setSalons(res.salons);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Could not refresh the overview.");
        })
        .finally(() => setSectionLoading(false));
      return;
    }

    if (section === "Salons" || section === "Financials" || section === "Notifications" || section === "Operations") {
      setData(null);
      return;
    }

    let active = true;
    setSectionLoading(true);
    setError("");
    const resource = section.toLowerCase().replace(" ", "-");
    void api(`/api/platform/${resource}`)
      .then((x) => {
        if (active) setData(x);
        if (section === "Users") {
          void api<Array<{ id: string; name: string }>>("/api/platform/roles")
            .then((roles) => { if (active) setPlatformRoles(roles); })
            .catch((roleError) => { if (active) setError(roleError instanceof Error ? roleError.message : "Could not load platform roles."); });
        }
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

  const visible = useMemo(
    () =>
      salons.filter((s) =>
        `${s.salonName} ${s.code} ${s.email} ${s.city || ""} ${s.subscriptionPlan}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [salons, search],
  );

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSubmitting(true);
    setActionLabel("Signing in…");
    setError("");
    try {
      const session = await api<{ user?: { role?: string }; salon?: unknown }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      if (session.user?.role !== "PLATFORM_ADMIN" || session.salon !== null) {
        throw new Error("This account is a salon account. Sign in with a PLATFORM_ADMIN account to open Super Admin.");
      }
      setAuth(true);
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  function openCreate() {
    setTemporaryPassword(generateTemporaryPassword());
    setCreate(true);
  }

  async function createSalon(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    const f = new FormData(el);
    const p = {
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
    setActionLabel("Creating salon workspace…");
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
        `${p.salonName} workspace was created successfully${
          copied ? " and admin credentials copied to your clipboard" : ""
        }.`,
      );
      setSection("Salons");
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not create salon.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function handleUpdateSalonStatus(salonId: string, status: Status) {
    setSubmitting(true);
    setActionLabel(`Updating salon status to ${status}…`);
    setError("");
    try {
      await api(`/api/salons/${salonId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setSuccess(`Salon status updated to ${status}.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update salon status.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function handleEditSalon(id: string, patch: Partial<Salon>) {
    setSubmitting(true);
    setActionLabel("Saving salon details…");
    setError("");
    try {
      await api(`/api/salons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setEditingSalon(null);
      setSuccess("Salon details saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update salon.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function handleDeleteSalon(salon: Salon) {
    if (!confirm(`Are you sure you want to archive "${salon.salonName}"?`)) return;
    setSubmitting(true);
    setActionLabel(`Archiving ${salon.salonName}…`);
    setError("");
    try {
      await api(`/api/salons/${salon.id}`, { method: "DELETE" });
      setSuccess(`Salon "${salon.salonName}" has been archived.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not archive salon.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function handleRestoreSalon(salon: Salon) {
    if (!confirm(`Restore "${salon.salonName}" as a suspended salon?`)) return;
    setSubmitting(true);
    setActionLabel(`Restoring ${salon.salonName}…`);
    setError("");
    try {
      await api(`/api/platform/salons/${salon.id}/restore`, { method: "POST" });
      setSuccess(`Salon "${salon.salonName}" restored as suspended.`);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not restore salon.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function handleUpgradePlan(sub: Subscription, newPlan: string) {
    setSubmitting(true);
    setActionLabel(`Updating ${sub.salonName} plan…`);
    setError("");
    try {
      await api(`/api/salons/${sub.id}`, {
        method: "PATCH",
        body: JSON.stringify({ subscriptionPlan: newPlan }),
      });
      setSuccess(`Updated ${sub.salonName} plan to ${newPlan}.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update subscription plan.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function handleExtendTrial(id: string, newDate: string) {
    setSubmitting(true);
    setActionLabel("Extending trial…");
    setError("");
    try {
      await api(`/api/salons/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ trialEndsAt: new Date(newDate).toISOString() }),
      });
      setExtendingSubscription(null);
      setSuccess("Trial duration extended.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not extend trial.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function handleCreateUser(payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    salonId?: string;
    platformRoleId?: string;
  }) {
    setSubmitting(true);
    setActionLabel("Creating user…");
    setError("");
    try {
      const newUser = await api<PlatformUser>("/api/platform/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCreateUserOpen(false);
      setData(list<PlatformUser>(data).concat(newUser));
      setSuccess(`User ${payload.name} created successfully.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create user.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function openCreateUser() {
    try {
      setPlatformRoles(await api<Array<{ id: string; name: string }>>("/api/platform/roles"));
      setCreateUserOpen(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load platform roles.");
    }
  }

  async function assignPlatformRole(user: PlatformUser, platformRoleId: string | null) {
    setSubmitting(true);
    try {
      const updated = await api<PlatformUser>(`/api/platform/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ platformRoleId }) });
      setData(list<PlatformUser>(data).map((item) => item.id === updated.id ? updated : item));
      setSuccess("Platform role updated.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update platform role.");
    } finally { setSubmitting(false); }
  }

  async function handleResetPassword(id: string, newPass: string) {
    setSubmitting(true);
    setActionLabel("Resetting password…");
    setError("");
    try {
      await api(`/api/platform/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword: newPass }),
      });
      setResettingUser(null);
      setSuccess("User password reset successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset password.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function toggleUser(u: PlatformUser) {
    setSubmitting(true);
    setActionLabel(`${u.active ? "Disabling" : "Enabling"} ${u.name}…`);
    setError("");
    try {
      const x = await api<PlatformUser>(`/api/platform/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !u.active }),
      });
      setData(list<PlatformUser>(data).map((i) => (i.id === x.id ? x : i)));
      setSuccess(`${u.name} is now ${x.active ? "active" : "inactive"}.`);
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not update user.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function saveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSubmitting(true);
    setActionLabel("Saving platform settings…");
    setError("");
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
      setSuccess("Platform configuration saved.");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not save settings.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function sendNotification(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    setActionLabel("Sending announcement…");
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
        `Announcement sent to ${result.count} salon${result.count === 1 ? "" : "s"}.`,
      );
    } catch (x) {
      setError(x instanceof Error ? x.message : "Could not send notification.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  const nav = [
    [LayoutDashboard, "Overview"],
    [Building2, "Salons"],
    [Users, "Users"],
    [CreditCard, "Subscriptions"],
    [CreditCard, "Plans"],
    [FileClock, "Audit Log"],
    [Settings, "Settings"],
    [Bell, "Notifications"],
    [BarChart3, "Financials"],
    [Settings, "Operations"],
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

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div
        aria-live="polite"
        className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-md space-y-3 sm:right-6 sm:top-6"
      >
        <AnimatePresence initial={false}>
          {submitting && actionLabel && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 24, y: -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 24, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="status"
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 shadow-lg"
            >
              {actionLabel}
            </motion.div>
          )}
          {error && (
            <motion.div
              key={`error-${error}`}
              initial={{ opacity: 0, x: 24, y: -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 24, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Notice type="error" message={error} onClose={() => setError("")} />
            </motion.div>
          )}
          {success && (
            <motion.div
              key={`success-${success}`}
              initial={{ opacity: 0, x: 24, y: -8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 24, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Notice type="success" message={success} onClose={() => setSuccess("")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white lg:flex lg:flex-col shadow-sm">
        <div className="p-6 pb-3">
          <Brand />
        </div>
        <Navigation items={nav} section={section} choose={choose} />
        <SidebarFooter onLogout={logout} />
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
            <SidebarFooter onLogout={logout} />
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
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  <Bell className="h-4 w-4" />
                  Broadcast
                </button>
                <button onClick={openCreate} className={buttonClass}>
                  <Plus className="h-4 w-4" />
                  Add Salon
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <SectionHeading title={section} subtitle={copy[section]} />
          <div className="mt-6 space-y-6">
            {section === "Overview" && (
              <Overview
                overview={overview}
                onViewSalons={() => choose("Salons")}
                onUpdateStatus={handleUpdateSalonStatus}
              />
            )}

            {section === "Salons" && (
              <SalonsView
                salons={visible}
                total={salons.length}
                loading={loading}
                search={search}
                setSearch={setSearch}
                onCreate={openCreate}
                onEdit={setEditingSalon}
                onUpdateStatus={handleUpdateSalonStatus}
                onDelete={handleDeleteSalon}
                onRestore={handleRestoreSalon}
                onViewDetails={setViewingSalon}
              />
            )}

            {section === "Subscriptions" && (
              <SubscriptionsView
                items={list<Subscription>(data)}
                loading={sectionLoading}
                onUpgradePlan={handleUpgradePlan}
                onExtendTrial={setExtendingSubscription}
                onUpdateStatus={handleUpdateSalonStatus}
              />
            )}

            {section === "Plans" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <button onClick={() => setCreatingPlan(true)} className="flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50"><Plus className="mb-2 h-5 w-5" />Create plan</button>
                {sectionLoading && <p className="text-sm text-zinc-500">Loading plans…</p>}
                {list<Plan>(data).map((plan) => (
                  <article key={plan.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-zinc-400">{plan.code}</p><h2 className="mt-1 text-lg font-bold">{plan.name}</h2></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${plan.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{plan.isActive ? "Active" : "Inactive"}</span></div>
                    <p className="mt-3 text-sm text-zinc-500">{plan.description || "Feature bundle for salon workspaces."}</p>
                    <p className="mt-4 text-sm font-semibold text-zinc-900">{plan.monthlyPrice == null ? "Custom pricing" : `₹${plan.monthlyPrice}/month`}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Included features</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{plan.features?.map(({ feature }) => <span key={feature.code} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">{feature.name}</span>)}</div>
                    <p className="mt-4 text-xs text-zinc-500">{plan._count?.subscriptions ?? 0} subscription(s)</p>
                    <button onClick={() => setEditingPlan(plan)} className="mt-4 text-sm font-semibold text-zinc-700 underline">Edit plan</button>
                  </article>
                ))}
              </div>
            )}

            {section === "Users" && (
              <UsersView
                items={list<PlatformUser>(data)}
                loading={sectionLoading}
                onToggle={toggleUser}
                onCreateUser={openCreateUser}
                onResetPassword={setResettingUser}
                roles={platformRoles}
                onAssignPlatformRole={assignPlatformRole}
              />
            )}

            {section === "Audit Log" && (
              <AuditView
                items={list<AuditItem>(data)}
                loading={sectionLoading}
              />
            )}

            {section === "Financials" && <ReportsConsole request={api} />}

            {section === "Operations" && <OperationsConsole salons={salons} request={api} onRefresh={load} />}

            {section === "Notifications" && (
              <NotificationView
                salons={salons}
                submitting={submitting}
                onSubmit={sendNotification}
              />
            )}

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

      {/* Modals */}
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

      {editingSalon && (
        <EditSalonModal
          salon={editingSalon}
          onClose={() => setEditingSalon(null)}
          onSubmit={handleEditSalon}
          submitting={submitting}
        />
      )}

      {viewingSalon && (
        <SalonDetailsModal
          salon={viewingSalon}
          onClose={() => setViewingSalon(null)}
          onManage={() => { setManagingSalon(viewingSalon); setViewingSalon(null); }}
        />
      )}

      {managingSalon && <SalonEntitlementsModal salon={managingSalon} onClose={() => setManagingSalon(null)} onSaved={() => void load()} />}
      {(creatingPlan || editingPlan) && <PlanEditor plan={editingPlan} onClose={() => { setCreatingPlan(false); setEditingPlan(null); }} onSaved={async () => { setData(await api("/api/platform/plans")); setCreatingPlan(false); setEditingPlan(null); }} />}

      {extendingSubscription && (
        <ExtendTrialModal
          subscription={extendingSubscription}
          onClose={() => setExtendingSubscription(null)}
          onSubmit={handleExtendTrial}
          submitting={submitting}
        />
      )}

      {createUserOpen && (
        <CreateUserModal
          salons={salons}
          roles={platformRoles}
          onClose={() => setCreateUserOpen(false)}
          onSubmit={handleCreateUser}
          submitting={submitting}
        />
      )}

      {resettingUser && (
        <ResetPasswordModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
          onSubmit={handleResetPassword}
          submitting={submitting}
        />
      )}
    </main>
  );
}

function SalonEntitlementsModal({ salon, onClose, onSaved }: { salon: Salon; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<"Plan" | "Subscription" | "Features" | "Website">("Plan");
  const [plans, setPlans] = useState<Plan[]>([]); const [features, setFeatures] = useState<Feature[]>([]);
  const [subscription, setSubscription] = useState<SalonSubscription>(null); const [enabled, setEnabled] = useState<string[]>([]);
  const [website, setWebsite] = useState<Website>({ type: "NONE" }); const [error, setError] = useState(""); const [busy, setBusy] = useState(true);
  const loadData = useCallback(async () => { setBusy(true); try { const [p, f, s, e, w] = await Promise.all([api<Plan[]>("/api/platform/plans"), api<Feature[]>("/api/platform/features"), api<SalonSubscription>(`/api/platform/salons/${salon.id}/subscription`), api<{ code: string; enabled: boolean }[]>(`/api/platform/salons/${salon.id}/features`), api<Website>(`/api/platform/salons/${salon.id}/website`)]); setPlans(p); setFeatures(f); setSubscription(s); setEnabled(e.filter((item) => item.enabled).map((item) => item.code)); setWebsite(w ?? { type: "NONE" }); } catch (e) { setError(e instanceof Error ? e.message : "Could not load entitlement data."); } finally { setBusy(false); } }, [salon.id]);
  useEffect(() => { void loadData(); }, [loadData]);
  const saveSubscription = async (renew = false) => { const planId = subscription?.planId; if (!planId) return; try { const saved = await api<SalonSubscription>(`/api/platform/salons/${salon.id}/subscription${renew ? "/renew" : ""}`, { method: renew ? "POST" : "PATCH", body: JSON.stringify({ planId, status: renew ? "ACTIVE" : subscription.status, expiresAt: subscription.expiresAt }) }); setSubscription(saved); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save subscription."); } };
  const setPlan = async (planId: string) => { const current = subscription ?? { status: "ACTIVE", expiresAt: null }; try { const saved = await api<SalonSubscription>(`/api/platform/salons/${salon.id}/subscription`, { method: subscription ? "PATCH" : "POST", body: JSON.stringify({ planId, status: current.status, expiresAt: current.expiresAt }) }); setSubscription(saved); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : "Could not assign plan."); } };
  const toggle = async (code: string) => { const next = !enabled.includes(code); try { await api(`/api/platform/salons/${salon.id}/features`, { method: "PUT", body: JSON.stringify({ code, enabled: next }) }); setEnabled((items) => next ? [...items, code] : items.filter((item) => item !== code)); } catch (e) { setError(e instanceof Error ? e.message : "Could not update feature."); } };
  const saveWebsite = async () => { try { await api(`/api/platform/salons/${salon.id}/website`, { method: "PUT", body: JSON.stringify(website) }); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save website."); } };
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-950/60 sm:items-center sm:p-5"><div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"><header className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold uppercase text-zinc-400">Salon control centre</p><h2 className="text-xl font-bold">{salon.salonName}</h2></div><button onClick={onClose} className="rounded-lg p-2 hover:bg-zinc-100"><X /></button></header><nav className="flex gap-1 overflow-x-auto border-b p-3">{(["Plan", "Subscription", "Features", "Website"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === item ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>{item}</button>)}</nav><div className="overflow-y-auto p-5">{error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{busy ? <p className="text-sm text-zinc-500">Loading…</p> : <>{tab === "Plan" && <section><h3 className="font-semibold">Assigned plan</h3><select value={subscription?.planId ?? ""} onChange={(e) => void setPlan(e.target.value)} className="mt-3 w-full rounded-xl border px-3 py-2.5"><option value="">Select plan</option>{plans.filter((plan) => plan.isActive).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></section>}{tab === "Subscription" && <section className="space-y-3"><h3 className="font-semibold">Subscription status</h3><p className="text-sm text-zinc-600">{subscription ? `${subscription.status} · ${subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : "No expiry"}` : "No subscription yet"}</p><button disabled={!subscription} onClick={() => void saveSubscription(true)} className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Renew subscription</button></section>}{tab === "Features" && <section><h3 className="font-semibold">Feature overrides</h3><p className="mt-1 text-xs text-zinc-500">Each change is stored as a salon override.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{features.map((feature) => <label key={feature.code} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span>{feature.name}</span><input type="checkbox" checked={enabled.includes(feature.code)} onChange={() => void toggle(feature.code)} /></label>)}</div></section>}{tab === "Website" && <section className="space-y-3"><h3 className="font-semibold">Website configuration</h3><select value={website?.type ?? "NONE"} onChange={(e) => setWebsite({ ...(website ?? {}), type: e.target.value as NonNullable<Website>["type"] })} className="w-full rounded-xl border px-3 py-2.5"><option value="NONE">Not published</option><option value="TEMPLATE">Template website</option><option value="CUSTOM">Custom website</option></select><input value={website?.customDomain ?? ""} onChange={(e) => setWebsite({ ...(website ?? { type: "NONE" }), customDomain: e.target.value })} placeholder="Custom domain" className="w-full rounded-xl border px-3 py-2.5"/><button onClick={() => void saveWebsite()} className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white">Save website</button></section>}</>}</div></div></div>;
}

export function LegacySalonEntitlementsModal({ salon, onClose, onSaved }: { salon: Salon; onClose: () => void; onSaved: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]); const [features, setFeatures] = useState<Feature[]>([]);
  const [subscription, setSubscription] = useState<SalonSubscription>(null); const [enabled, setEnabled] = useState<string[]>([]);
  const [website, setWebsite] = useState<Website>({ type: "NONE" }); const [error, setError] = useState(""); const [busy, setBusy] = useState(true);
  const loadData = useCallback(async () => { setBusy(true); try { const [p, f, s, e, w] = await Promise.all([api<Plan[]>("/api/platform/plans"), api<Feature[]>("/api/platform/features"), api<SalonSubscription>(`/api/platform/salons/${salon.id}/subscription`), api<{ code: string; enabled: boolean }[]>(`/api/platform/salons/${salon.id}/features`), api<Website>(`/api/platform/salons/${salon.id}/website`)]); setPlans(p); setFeatures(f); setSubscription(s); setEnabled(e.filter((x) => x.enabled).map((x) => x.code)); setWebsite(w ?? { type: "NONE" }); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load entitlement data."); } finally { setBusy(false); } }, [salon.id]);
  useEffect(() => { void loadData(); }, [loadData]);
  const saveSubscription = async (planId: string) => { const payload = { planId, status: subscription?.status ?? "ACTIVE", expiresAt: subscription?.expiresAt ?? null }; try { const saved = await api<SalonSubscription>(`/api/platform/salons/${salon.id}/subscription`, { method: subscription ? "PATCH" : "POST", body: JSON.stringify(payload) }); setSubscription(saved); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save subscription."); } };
  const toggleFeature = async (code: string) => { const next = !enabled.includes(code); try { await api(`/api/platform/salons/${salon.id}/features`, { method: "PUT", body: JSON.stringify({ code, enabled: next }) }); setEnabled((items) => next ? [...items, code] : items.filter((item) => item !== code)); } catch (e) { setError(e instanceof Error ? e.message : "Could not update feature."); } };
  const saveWebsite = async () => { try { await api(`/api/platform/salons/${salon.id}/website`, { method: "PUT", body: JSON.stringify(website) }); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save website."); } };
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-950/60 p-0 sm:items-center sm:p-5"><div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"><header className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold uppercase text-zinc-400">Salon control centre</p><h2 className="text-xl font-bold">{salon.salonName}</h2></div><button onClick={onClose} className="rounded-lg p-2 hover:bg-zinc-100"><X /></button></header><div className="space-y-6 overflow-y-auto p-5">{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{busy ? <p className="text-sm text-zinc-500">Loading…</p> : <><section><h3 className="font-semibold">Plan & subscription</h3><select value={subscription?.planId ?? ""} onChange={(e) => void saveSubscription(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-2.5"><option value="">Select plan</option>{plans.filter((plan) => plan.isActive).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></section><section><h3 className="font-semibold">Feature overrides</h3><p className="mt-1 text-xs text-zinc-500">Toggle a feature to create a persisted salon override.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{features.map((feature) => <label key={feature.code} className="flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm"><span>{feature.name}</span><input type="checkbox" checked={enabled.includes(feature.code)} onChange={() => void toggleFeature(feature.code)} /></label>)}</div></section><section><h3 className="font-semibold">Website</h3><div className="mt-2 grid gap-3 sm:grid-cols-2"><select value={website?.type ?? "NONE"} onChange={(e) => setWebsite({ ...(website ?? {}), type: e.target.value as NonNullable<Website>["type"] })} className="rounded-xl border px-3 py-2.5"><option value="NONE">Not published</option><option value="TEMPLATE">Template</option><option value="CUSTOM">Custom</option></select><input value={website?.customDomain ?? ""} onChange={(e) => setWebsite({ ...(website ?? { type: "NONE" }), customDomain: e.target.value })} placeholder="Custom domain" className="rounded-xl border px-3 py-2.5" /></div><button onClick={() => void saveWebsite()} className="mt-3 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Save website</button></section></>}</div></div></div>;
}

function PlanEditor({ plan, onClose, onSaved }: { plan: Plan | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [features, setFeatures] = useState<Feature[]>([]); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  useEffect(() => { void api<Feature[]>("/api/platform/features").then(setFeatures).catch((e) => setError(e instanceof Error ? e.message : "Could not load features.")); }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const featureCodes = form.getAll("feature").map(String); const payload = { code: String(form.get("code")).trim().toUpperCase(), name: String(form.get("name")).trim(), description: String(form.get("description")).trim() || null, monthlyPrice: form.get("monthlyPrice") === "" ? null : Number(form.get("monthlyPrice")), annualPrice: form.get("annualPrice") === "" ? null : Number(form.get("annualPrice")), isActive: form.get("isActive") === "on" }; setSaving(true); setError(""); try { const saved = await api<Plan>(plan ? `/api/platform/plans/${plan.id}` : "/api/platform/plans", { method: plan ? "PATCH" : "POST", body: JSON.stringify(payload) }); await api(`/api/platform/plans/${saved.id}/features`, { method: "PUT", body: JSON.stringify({ featureCodes }) }); await onSaved(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save plan."); } finally { setSaving(false); } }
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/60 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{plan ? "Edit plan" : "Create plan"}</h2><button type="button" onClick={onClose}><X /></button></div>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-5 grid gap-3 sm:grid-cols-2"><input required name="code" defaultValue={plan?.code} placeholder="PLAN_CODE" className="rounded-xl border px-3 py-2.5"/><input required name="name" defaultValue={plan?.name} placeholder="Plan name" className="rounded-xl border px-3 py-2.5"/><input name="monthlyPrice" type="number" min="0" step="0.01" defaultValue={plan?.monthlyPrice ?? ""} placeholder="Monthly price" className="rounded-xl border px-3 py-2.5"/><input name="annualPrice" type="number" min="0" step="0.01" placeholder="Annual price" className="rounded-xl border px-3 py-2.5"/><textarea name="description" defaultValue={plan?.description ?? ""} placeholder="Description" className="min-h-24 rounded-xl border px-3 py-2.5 sm:col-span-2"/><label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={plan?.isActive ?? true}/> Active plan</label></div><h3 className="mt-6 font-semibold">Feature entitlement</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{features.map((feature) => <label key={feature.id} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input name="feature" type="checkbox" value={feature.code} defaultChecked={plan?.features?.some((item) => item.feature.code === feature.code)}/>{feature.name}</label>)}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={saving} className={buttonClass}>{saving ? "Saving…" : "Save plan"}</button></div></form></div>;
}
