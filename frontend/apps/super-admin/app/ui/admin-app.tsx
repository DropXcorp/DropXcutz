"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
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
  FinancialView,
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
  "Audit Log": "Chronological audit trail of all platform-wide administrative actions.",
  Settings: "Configure security policies, session longevity, and platform defaults.",
  Notifications: "Broadcast system alerts directly into salon ERP dashboards.",
  Financials: "Platform-wide billing volume and per-salon revenue performance.",
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
  const [extendingSubscription, setExtendingSubscription] = useState<Subscription | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<PlatformUser | null>(null);

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

    if (section === "Salons" || section === "Financials" || section === "Notifications") {
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
      if (session.user?.role !== "PLATFORM_ADMIN" && session.salon !== null) {
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

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
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
            {submitting && actionLabel && (
              <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                {actionLabel}
              </div>
            )}
            {error && (
              <Notice
                type="error"
                message={error}
                onClose={() => setError("")}
              />
            )}
            {success && (
              <Notice
                type="success"
                message={success}
                onClose={() => setSuccess("")}
              />
            )}

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

            {section === "Users" && (
              <UsersView
                items={list<PlatformUser>(data)}
                loading={sectionLoading}
                onToggle={toggleUser}
                onCreateUser={() => setCreateUserOpen(true)}
                onResetPassword={setResettingUser}
              />
            )}

            {section === "Audit Log" && (
              <AuditView
                items={list<AuditItem>(data)}
                loading={sectionLoading}
              />
            )}

            {section === "Financials" && <FinancialView salons={salons} />}

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
        />
      )}

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
