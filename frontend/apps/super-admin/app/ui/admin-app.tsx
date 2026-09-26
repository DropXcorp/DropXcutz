"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  Globe,
  FileClock,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import {
  AuditView,
  Brand,
  buttonClass,
  inputClass,
  ConfirmDialog,
  CreateSalonModal,
  CreateUserModal,
  EditSalonModal,
  ExtendTrialModal,
  FullPageLoader,
  ModalOverlay,
  outlineButtonClass,
  Navigation,
  NotificationView,
  Overview,
  ResetPasswordModal,
  SalonDetailsModal,
  SalonsView,
  SectionHeading,
  SessionsView,
  WebsitesView,
  SettingsView,
  SidebarFooter,
  SignIn,
  SubscriptionsView,
  UsersView,
} from "./admin-ui";
import { OperationsConsole } from "./operations-console";
import { ReportsConsole } from "./reports-console";
import RequestFeedback from "./RequestFeedback";
import type {
  AuditItem,
  OverviewData,
  PlatformSession,
  PlatformWebsite,
  SystemCheck,
  PlatformUser,
  Salon,
  Section,
  SettingsData,
  Status,
  Subscription,
} from "./admin-ui";

const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  monthlyPrice?: number | null;
  isActive: boolean;
  features?: { feature: { code: string; name: string } }[];
  _count?: { subscriptions: number };
};
type Feature = { id: string; code: string; name: string };
type SalonSubscription = {
  id: string;
  planId: string;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED";
  billingCycle: "MONTHLY" | "ANNUAL" | null;
  expiresAt: string | null;
} | null;
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
  Overview:
    "Live view of all salon workspaces, revenue and platform account health.",
  Salons: "Configure, activate, suspend, edit and monitor salon instances.",
  Users: "Manage platform super administrators and salon account credentials.",
  Subscriptions: "Track plans, trial expiration dates, and tier upgrades.",
  Plans: "Configure the feature bundles available to salon subscriptions.",
  Sessions: "Monitor active logins and support impersonation sessions.",
  Websites: "Every salon website: publishing status, addresses and custom-domain health.",
  "Audit Log":
    "Chronological audit trail of all platform-wide administrative actions.",
  Settings:
    "Configure security policies, session longevity, and platform defaults.",
  Notifications: "Broadcast system alerts directly into salon ERP dashboards.",
  Financials: "Platform-wide billing volume and per-salon revenue performance.",
  Operations:
    "Billing, support, access controls, security, and bulk salon updates.",
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const requestId = Math.random().toString(36).slice(2);
  window.dispatchEvent(new CustomEvent("dropxcutz:request-start", {
    detail: { requestId, button: document.activeElement instanceof HTMLButtonElement ? document.activeElement : null },
  }));
  try {
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
  } finally {
    window.dispatchEvent(new CustomEvent("dropxcutz:request-end", { detail: { requestId } }));
  }
}

export default function AdminApp() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [data, setData] = useState<unknown>(null);
  const [section, setSection] = useState<Section>("Overview");

  const [auth, setAuth] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const hasInitialOverview = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLabel, setActionLabel] = useState("");
  const [systemChecks, setSystemChecks] = useState<SystemCheck[] | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    tone?: "danger";
    onConfirm: () => void;
  } | null>(null);

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
  const [extendingSubscription, setExtendingSubscription] =
    useState<Subscription | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<PlatformUser | null>(null);
  const [platformRoles, setPlatformRoles] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [temporaryPassword, setTemporaryPassword] = useState(
    generateTemporaryPassword,
  );

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
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
      if (overviewData) {
        setOverview(overviewData);
        hasInitialOverview.current = true;
      }
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
    toast.success(success);
    setSuccess("");
  }, [success]);

  useEffect(() => {
    if (!error || !auth) return;
    toast.error(error);
    setError("");
  }, [error, auth]);

  useEffect(() => {
    if (submitting && actionLabel) toast.loading(actionLabel, { id: "action-progress" });
    else toast.dismiss("action-progress");
  }, [submitting, actionLabel]);

  useEffect(() => {
    if (!auth || section !== "Websites") return;
    void api<SystemCheck[]>("/api/platform/system-status").then(setSystemChecks).catch(() => setSystemChecks(null));
  }, [auth, section]);

  useEffect(() => {
    if (!auth) return;

    if (section === "Overview") {
      if (hasInitialOverview.current) {
        hasInitialOverview.current = false;
        return;
      }
      const refresh = (silent: boolean) => {
        if (!silent) setSectionLoading(true);
        return api<OverviewData>("/api/platform/overview")
          .then((res) => {
            setOverview(res);
            if (res.salons) setSalons(res.salons);
          })
          .catch((e) => {
            if (!silent)
              setError(
                e instanceof Error ? e.message : "Could not refresh the overview.",
              );
          })
          .finally(() => {
            if (!silent) setSectionLoading(false);
          });
      };
      void refresh(false);
      const timer = window.setInterval(() => {
        if (document.visibilityState === "visible") void refresh(true);
      }, 25000);
      return () => window.clearInterval(timer);
    }

    if (
      section === "Salons" ||
      section === "Financials" ||
      section === "Notifications" ||
      section === "Operations"
    ) {
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
            .then((roles) => {
              if (active) setPlatformRoles(roles);
            })
            .catch((roleError) => {
              if (active)
                setError(
                  roleError instanceof Error
                    ? roleError.message
                    : "Could not load platform roles.",
                );
            });
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
      const session = await api<{ user?: { role?: string }; salon?: unknown }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: f.get("email"),
            password: f.get("password"),
          }),
        },
      );
      if (session.user?.role !== "PLATFORM_ADMIN" || session.salon !== null) {
        throw new Error(
          "This account is a salon account. Sign in with a PLATFORM_ADMIN account to open Super Admin.",
        );
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
      const erpUrl = process.env.NEXT_PUBLIC_ERP_URL?.trim();
      const credentials = [
        "DropXcutz salon admin login",
        `Salon: ${p.salonName}`,
        `Salon code: ${p.code}`,
        `ERP URL: ${erpUrl || "Not configured — ask your platform administrator"}`,
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
    setActionLabel(
      `Updating salon status to ${status}…`,
    );
    setError("");
    try {
      await api(`/api/salons/${salonId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setSuccess(`Salon status updated to ${status}.`);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update salon status.",
      );
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

  function handleImpersonateSalon(salon: Salon) {
    setConfirmState({
      title: "Start a support session?",
      description: `You'll be logged in as "${salon.salonName}"'s admin. This is recorded in the audit log.`,
      confirmLabel: "Start session",
      onConfirm: () => {
        setConfirmState(null);
        void runImpersonateSalon(salon);
      },
    });
  }

  async function runImpersonateSalon(salon: Salon) {
    setSubmitting(true);
    setActionLabel(`Starting impersonation session for ${salon.salonName}…`);
    setError("");
    try {
      await api(`/api/platform/salons/${salon.id}/impersonate`, { method: "POST" });
      const erpUrl = process.env.NEXT_PUBLIC_ERP_URL?.trim();
      if (erpUrl) window.open(erpUrl, "_blank", "noopener,noreferrer");
      else setError("NEXT_PUBLIC_ERP_URL is not configured; the session was created but no ERP link is available.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start impersonation session.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  function handleDeleteSalon(salon: Salon) {
    setConfirmState({
      title: "Archive this salon?",
      description: `"${salon.salonName}" will be archived and its access suspended. You can restore it later.`,
      confirmLabel: "Archive salon",
      tone: "danger",
      onConfirm: () => {
        setConfirmState(null);
        void runDeleteSalon(salon);
      },
    });
  }

  async function runDeleteSalon(salon: Salon) {
    setSubmitting(true);
    setActionLabel(
      `Archiving ${salon.salonName}…`,
    );
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

  function handleRestoreSalon(salon: Salon) {
    setConfirmState({
      title: "Restore this salon?",
      description: `"${salon.salonName}" will be restored with a suspended status. You can activate it afterward.`,
      confirmLabel: "Restore salon",
      onConfirm: () => {
        setConfirmState(null);
        void runRestoreSalon(salon);
      },
    });
  }

  async function runRestoreSalon(salon: Salon) {
    setSubmitting(true);
    setActionLabel(
      `Restoring ${salon.salonName}…`,
    );
    setError("");
    try {
      await api(`/api/platform/salons/${salon.id}/restore`, { method: "POST" });
      setSuccess(`Salon "${salon.salonName}" restored as suspended.`);
      await load();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not restore salon.",
      );
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function handleUpgradePlan(sub: Subscription, newPlan: string) {
    setSubmitting(true);
    setActionLabel(
      `Updating ${sub.salonName} plan…`,
    );
    setError("");
    try {
      await api(`/api/salons/${sub.id}`, {
        method: "PATCH",
        body: JSON.stringify({ subscriptionPlan: newPlan }),
      });
      setSuccess(`Updated ${sub.salonName} plan to ${newPlan}.`);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update subscription plan.",
      );
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
      setPlatformRoles(
        await api<Array<{ id: string; name: string }>>("/api/platform/roles"),
      );
      setCreateUserOpen(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load platform roles.",
      );
    }
  }

  async function assignPlatformRole(
    user: PlatformUser,
    platformRoleId: string | null,
  ) {
    setSubmitting(true);
    try {
      const updated = await api<PlatformUser>(
        `/api/platform/users/${user.id}`,
        { method: "PATCH", body: JSON.stringify({ platformRoleId }) },
      );
      setData(
        list<PlatformUser>(data).map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );
      setSuccess("Platform role updated.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not update platform role.",
      );
    } finally {
      setSubmitting(false);
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
    setActionLabel(
      `${u.active ? "Disabling" : "Enabling..."} ${u.name}…`,
    );
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

  function handleRevokeSessions(u: PlatformUser) {
    setConfirmState({
      title: "Force-logout this user?",
      description: `All active sessions for "${u.name}" will be revoked immediately.`,
      confirmLabel: "Revoke sessions",
      tone: "danger",
      onConfirm: () => {
        setConfirmState(null);
        void runRevokeSessions(u);
      },
    });
  }

  async function runRevokeSessions(u: PlatformUser) {
    setSubmitting(true);
    setActionLabel(`Revoking sessions for ${u.name}…`);
    setError("");
    try {
      const result = await api<{ revokedCount: number }>(
        `/api/platform/users/${u.id}/sessions`,
        { method: "DELETE" },
      );
      setSuccess(`Revoked ${result.revokedCount} active session(s) for ${u.name}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke sessions.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  function handleUnpublishWebsite(site: PlatformWebsite) {
    setConfirmState({
      title: "Unpublish this website?",
      description: `"${site.salonName}"'s public website will go offline immediately. The salon can publish it again.`,
      confirmLabel: "Unpublish",
      tone: "danger",
      onConfirm: () => {
        setConfirmState(null);
        void runWebsiteAction(site, { isPublished: false }, "Website unpublished.");
      },
    });
  }

  async function runWebsiteAction(site: PlatformWebsite, body: Record<string, unknown>, success: string) {
    setSubmitting(true);
    setActionLabel(`Updating ${site.salonName}'s website…`);
    try {
      await api(`/api/platform/salons/${site.salonId}/website`, { method: "PUT", body: JSON.stringify(body) });
      setData(await api("/api/platform/websites"));
      setSuccess(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the website.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  async function handleVerifyWebsite(site: PlatformWebsite) {
    setSubmitting(true);
    setActionLabel("Checking DNS…");
    try {
      await api(`/api/platform/salons/${site.salonId}/website/verify-domain`, { method: "POST" });
      setData(await api("/api/platform/websites"));
      setSuccess("DNS checked.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check DNS.");
    } finally {
      setSubmitting(false);
      setActionLabel("");
    }
  }

  function handleRevokeSession(s: PlatformSession) {
    setConfirmState({
      title: s.impersonatedBy ? "End this impersonation session?" : "End this session?",
      description: s.impersonatedBy
        ? `The support session for "${s.user.name}" will be ended immediately.`
        : `"${s.user.name}" will be signed out of this session immediately.`,
      confirmLabel: "End session",
      tone: "danger",
      onConfirm: () => {
        setConfirmState(null);
        void runRevokeSession(s);
      },
    });
  }

  async function runRevokeSession(s: PlatformSession) {
    setSubmitting(true);
    setActionLabel("Revoking session…");
    setError("");
    try {
      await api(`/api/platform/sessions/${s.id}`, { method: "DELETE" });
      setData(list<PlatformSession>(data).filter((item) => item.id !== s.id));
      setSuccess("Session revoked.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke session.");
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
    [Globe, "Websites"],
    [ShieldAlert, "Sessions"],
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
    <main className="min-h-screen bg-[#f7f8fa] text-foreground">
      <RequestFeedback />
      <Toaster position="top-right" richColors closeButton />
      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={confirmState?.confirmLabel ?? "Confirm"}
        tone={confirmState?.tone}
        busy={submitting}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => confirmState?.onConfirm()}
      />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col shadow-sm">
        <div className="p-6 pb-3">
          <Brand />
        </div>
        <Navigation items={nav} section={section} choose={choose} />
        <SidebarFooter onLogout={logout} />
      </aside>

      {mobile && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs lg:hidden"
          onClick={() => setMobile(false)}
        >
          <aside
            className="flex h-full w-72 flex-col bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between border-b p-5">
              <Brand />
              <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setMobile(false)}>
                <X />
              </Button>
            </div>
            <Navigation items={nav} section={section} choose={choose} />
            <SidebarFooter onLogout={logout} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMobile(true)}>
                <Menu />
              </Button>
              <div>
                <p className="text-xs text-muted-foreground">Workspace / {section}</p>
                <h1 className="text-xl font-bold">{section}</h1>
              </div>
            </div>
            {(section === "Overview" || section === "Salons") && (
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 gap-2 px-4 font-semibold" onClick={() => choose("Notifications")}>
                  <Bell className="h-4 w-4" />
                  Broadcast
                </Button>
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
                busy={submitting}
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
                onImpersonate={handleImpersonateSalon}
                busy={submitting}
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
                <button
                  onClick={() => setCreatingPlan(true)}
                  className="flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-muted/60"
                >
                  <Plus className="mb-2 h-5 w-5" />
                  Create plan
                </button>
                {sectionLoading && (
                  <p className="text-sm text-muted-foreground">
                    Loading plans…
                  </p>
                )}
                {list<Plan>(data).map((plan) => (
                  <article
                    key={plan.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          {plan.code}
                        </p>
                        <h2 className="mt-1 text-lg font-bold">{plan.name}</h2>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${plan.isActive ? "bg-emerald-50 text-emerald-700" : "bg-muted/60 text-foreground/70"}`}
                      >
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {plan.description ||
                        "Feature bundle for salon workspaces."}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      {plan.monthlyPrice == null
                        ? "Custom pricing"
                        : `₹${plan.monthlyPrice}/month`}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Included features
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {plan.features?.map(({ feature }) => (
                        <span
                          key={feature.code}
                          className="rounded-md bg-muted/60 px-2 py-1 text-xs text-foreground/80"
                        >
                          {feature.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {plan._count?.subscriptions ?? 0} subscription(s)
                    </p>
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="mt-4 text-sm font-semibold text-foreground/80 underline"
                    >
                      Edit plan
                    </button>
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
                onRevokeSessions={handleRevokeSessions}
                busy={submitting}
              />
            )}

            {section === "Websites" && (
              <WebsitesView
                items={list<PlatformWebsite>(data)}
                checks={systemChecks}
                loading={sectionLoading}
                busy={submitting}
                onManage={(salonId) => {
                  const target = salons.find((item) => item.id === salonId);
                  if (target) setManagingSalon(target);
                }}
                onUnpublish={handleUnpublishWebsite}
                onVerify={(site) => void handleVerifyWebsite(site)}
              />
            )}

            {section === "Sessions" && (
              <SessionsView
                items={list<PlatformSession>(data)}
                loading={sectionLoading}
                onRevoke={handleRevokeSession}
                busy={submitting}
              />
            )}

            {section === "Audit Log" && (
              <AuditView
                items={list<AuditItem>(data)}
                loading={sectionLoading}
              />
            )}

            {section === "Financials" && <ReportsConsole request={api} />}

            {section === "Operations" && (
              <OperationsConsole
                salons={salons}
                request={api}
                onRefresh={load}
              />
            )}

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
          onManage={() => {
            setManagingSalon(viewingSalon);
            setViewingSalon(null);
          }}
        />
      )}

      {managingSalon && (
        <SalonEntitlementsModal
          salon={managingSalon}
          onClose={() => setManagingSalon(null)}
          onSaved={() => void load()}
        />
      )}
      {(creatingPlan || editingPlan) && (
        <PlanEditor
          plan={editingPlan}
          onClose={() => {
            setCreatingPlan(false);
            setEditingPlan(null);
          }}
          onSaved={async () => {
            setData(await api("/api/platform/plans"));
            setCreatingPlan(false);
            setEditingPlan(null);
          }}
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

function SalonEntitlementsModal({
  salon,
  onClose,
  onSaved,
}: {
  salon: Salon;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<
    "Plan" | "Subscription" | "Features" | "Website"
  >("Plan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [subscription, setSubscription] = useState<SalonSubscription>(null);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError("");
  }, [error]);
  const loadData = useCallback(async () => {
    setBusy(true);
    try {
      const [p, f, s, e] = await Promise.all([
        api<Plan[]>("/api/platform/plans"),
        api<Feature[]>("/api/platform/features"),
        api<SalonSubscription>(`/api/platform/salons/${salon.id}/subscription`),
        api<{ code: string; enabled: boolean }[]>(
          `/api/platform/salons/${salon.id}/features`,
        ),
      ]);
      setPlans(p);
      setFeatures(f);
      setSubscription(s);
      setEnabled(e.filter((item) => item.enabled).map((item) => item.code));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load entitlement data.",
      );
    } finally {
      setBusy(false);
    }
  }, [salon.id]);
  useEffect(() => {
    void loadData();
  }, [loadData]);
  const saveSubscription = async (renew = false) => {
    const planId = subscription?.planId;
    if (!planId) return;
    setSaving(true);
    try {
      const saved = await api<SalonSubscription>(
        `/api/platform/salons/${salon.id}/subscription${renew ? "/renew" : ""}`,
        {
          method: renew ? "POST" : "PATCH",
          body: JSON.stringify({
            planId,
            status: renew ? "ACTIVE" : subscription.status,
            billingCycle: subscription.billingCycle,
            expiresAt: subscription.expiresAt,
          }),
        },
      );
      setSubscription(saved);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save subscription.");
    } finally {
      setSaving(false);
    }
  };
  const cancelSubscription = async () => {
    if (!subscription) return;
    setSaving(true);
    try {
      const saved = await api<SalonSubscription>(
        `/api/platform/salons/${salon.id}/subscription/cancel`,
        { method: "POST" },
      );
      setSubscription(saved);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel subscription.");
    } finally {
      setSaving(false);
    }
  };
  const setPlan = async (planId: string) => {
    const current = subscription ?? { status: "ACTIVE", billingCycle: "MONTHLY" as const, expiresAt: null };
    try {
      const saved = await api<SalonSubscription>(
        `/api/platform/salons/${salon.id}/subscription`,
        {
          method: subscription ? "PATCH" : "POST",
          body: JSON.stringify({
            planId,
            status: current.status,
            billingCycle: current.billingCycle,
            expiresAt: current.expiresAt,
          }),
        },
      );
      setSubscription(saved);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign plan.");
    }
  };
  const setBillingCycle = async (billingCycle: "MONTHLY" | "ANNUAL") => {
    if (!subscription) return;
    try {
      const saved = await api<SalonSubscription>(
        `/api/platform/salons/${salon.id}/subscription`,
        { method: "PATCH", body: JSON.stringify({ planId: subscription.planId, status: subscription.status, billingCycle }) },
      );
      setSubscription(saved);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update billing cycle.");
    }
  };
  const toggle = async (code: string) => {
    const next = !enabled.includes(code);
    try {
      await api(`/api/platform/salons/${salon.id}/features`, {
        method: "PUT",
        body: JSON.stringify({ code, enabled: next }),
      });
      setEnabled((items) =>
        next ? [...items, code] : items.filter((item) => item !== code),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update feature.");
    }
  };
  const grantTemplateAccess = async () => {
    try {
      const required = [
        "ONLINE_BOOKING",
        "TEMPLATE_WEBSITE",
        "WEBSITE_MANAGEMENT",
      ];
      await Promise.all(
        required
          .filter((code) => !enabled.includes(code))
          .map((code) =>
            api(`/api/platform/salons/${salon.id}/features`, {
              method: "PUT",
              body: JSON.stringify({ code, enabled: true }),
            }),
          ),
      );
      setEnabled((items) => [...new Set([...items, ...required])]);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not grant template website access.",
      );
    }
  };
  if (tab === "Website")
    return (
      <WebsiteIntegrationWorkspace
        salon={salon}
        subscription={subscription}
        enabledFeatures={enabled}
        onGrantTemplateAccess={grantTemplateAccess}
        onBack={() => setTab("Plan")}
        onClose={onClose}
      />
    );
  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl">
        <header className="flex items-center justify-between border-b p-5">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">
              Salon control centre
            </p>
            <h2 className="text-xl font-bold">{salon.salonName}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted/60"
          >
            <X />
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b p-3">
          {(["Plan", "Subscription", "Features", "Website"] as const).map(
            (item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === item ? "bg-primary text-white" : "text-foreground/70 hover:bg-muted/60"}`}
              >
                {item}
              </button>
            ),
          )}
        </nav>
        <div className="overflow-y-auto p-5">
          {busy ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              {tab === "Plan" && (
                <section>
                  <h3 className="font-semibold">Assigned plan</h3>
                  <select
                    value={subscription?.planId ?? ""}
                    onChange={(e) => void setPlan(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select plan</option>
                    {plans
                      .filter((plan) => plan.isActive)
                      .map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                  </select>
                </section>
              )}
              {tab === "Subscription" && (
                <section className="space-y-3">
                  <h3 className="font-semibold">Subscription status</h3>
                  <p className="text-sm text-foreground/70">
                    {subscription
                      ? `${subscription.status} · ${subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : "No expiry"}`
                      : "No subscription yet"}
                  </p>
                  <label className="block text-sm font-medium text-foreground/80">
                    Billing cycle
                    <select
                      disabled={!subscription}
                      value={subscription?.billingCycle ?? "MONTHLY"}
                      onChange={(e) => void setBillingCycle(e.target.value as "MONTHLY" | "ANNUAL")}
                      className={`${inputClass} mt-1`}
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="ANNUAL">Annual</option>
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <button
                      disabled={!subscription || saving}
                      onClick={() => void saveSubscription(true)}
                      className={buttonClass}
                    >
                      {saving ? "Working…" : "Renew subscription"}
                    </button>
                    <button
                      disabled={!subscription || subscription.status === "CANCELLED" || saving}
                      onClick={() => setConfirmCancel(true)}
                      className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {saving ? "Working…" : "Cancel subscription"}
                    </button>
                  </div>
                </section>
              )}
              {tab === "Features" && (
                <section>
                  <h3 className="font-semibold">Feature overrides</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Each change is stored as a salon override.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {features.map((feature) => (
                      <label
                        key={feature.code}
                        className="flex items-center justify-between rounded-xl border p-3 text-sm"
                      >
                        <span>{feature.name}</span>
                        <input
                          type="checkbox"
                          checked={enabled.includes(feature.code)}
                          onChange={() => void toggle(feature.code)}
                        />
                      </label>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this subscription?"
        description={`Cancelling the subscription for "${salon.salonName}" immediately suspends the salon's access.`}
        confirmLabel="Cancel subscription"
        tone="danger"
        busy={saving}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          void cancelSubscription();
        }}
      />
    </ModalOverlay>
  );
}

type WebsiteInfo = {
  slug: string;
  settings: {
    type: "NONE" | "TEMPLATE" | "CUSTOM";
    isPublished: boolean;
    customDomain: string | null;
    domainStatus: "NONE" | "PENDING_DNS" | "VERIFYING" | "ACTIVE" | "FAILED";
    domainError: string | null;
  } | null;
  urls: { subdomain: string | null; custom: string | null; live: string | null };
  dns: { cname: { host: string; value: string }; txt: { host: string; value: string } } | null;
};

function WebsiteIntegrationWorkspace({
  salon,
  subscription,
  enabledFeatures,
  onGrantTemplateAccess,
  onBack,
  onClose,
}: {
  salon: Salon;
  subscription: SalonSubscription;
  enabledFeatures: string[];
  onGrantTemplateAccess: () => Promise<void>;
  onBack: () => void;
  onClose: () => void;
}) {
  const [info, setInfo] = useState<WebsiteInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [domain, setDomain] = useState("");
  const active = ["ACTIVE", "TRIAL"].includes(subscription?.status ?? "");
  const templateEligible = active && enabledFeatures.includes("ONLINE_BOOKING") && enabledFeatures.includes("TEMPLATE_WEBSITE");
  const customEligible = active && enabledFeatures.includes("ONLINE_BOOKING") && enabledFeatures.includes("CUSTOM_WEBSITE") && enabledFeatures.includes("PUBLIC_API");
  const current = info?.settings?.type ?? "NONE";

  const load = useCallback(async () => {
    try {
      const next = await api<WebsiteInfo>(`/api/platform/salons/${salon.id}/website`);
      setInfo(next);
      setDomain(next.settings?.customDomain ?? "");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not load the website settings.");
    }
  }, [salon.id]);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (task: () => Promise<WebsiteInfo>, success: string) => {
    setBusy(true);
    try {
      const next = await task();
      setInfo(next);
      setDomain(next.settings?.customDomain ?? "");
      toast.success(success);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update the website.");
    } finally {
      setBusy(false);
    }
  };
  const put = (body: Record<string, unknown>, success: string) =>
    act(() => api<WebsiteInfo>(`/api/platform/salons/${salon.id}/website`, { method: "PUT", body: JSON.stringify(body) }), success);

  const missingTemplateFeatures = ["ONLINE_BOOKING", "TEMPLATE_WEBSITE", "WEBSITE_MANAGEMENT"].filter((code) => !enabledFeatures.includes(code));
  if (!templateEligible && !customEligible)
    return <TemplateWebsiteBlocked salon={salon} subscription={subscription} missingFeatures={missingTemplateFeatures} onGrant={onGrantTemplateAccess} onBack={onBack} onClose={onClose} />;

  const status = info?.settings?.domainStatus ?? "NONE";
  const published = Boolean(info?.settings?.isPublished);
  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl">
        <header className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2.5 text-primary-foreground"><Globe className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Website</p>
              <h2 className="text-xl font-bold">{salon.salonName}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${published ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{published ? "Published" : current === "NONE" ? "Not set up" : "Draft"}</span>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted/60" aria-label="Close"><X /></button>
          </div>
        </header>
        <div className="space-y-6 overflow-y-auto p-5 sm:p-7">
          {!info ? (
            <div className="h-40 animate-pulse rounded-2xl bg-muted/60" />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {([
                  { value: "TEMPLATE", name: "Template website", blurb: "Managed booking site hosted by DropXcutz. The salon designs it from its own dashboard.", need: "Online Booking + Template Website", ok: templateEligible },
                  { value: "CUSTOM", name: "Custom website", blurb: "A developer-built site that calls our booking API with the salon's API key.", need: "Online Booking + Custom Website + Public API", ok: customEligible },
                ] as const).map((option) => (
                  <button key={option.value} disabled={busy || !option.ok} onClick={() => void put({ type: option.value }, `${option.name} selected.`)}
                    className={`rounded-2xl border p-5 text-left transition ${current === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted/40"} disabled:cursor-not-allowed disabled:opacity-45`}>
                    <p className="text-sm font-bold">{option.name}</p>
                    <p className={`mt-2 text-sm ${current === option.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{option.blurb}</p>
                    <p className="mt-3 text-xs font-semibold">{option.ok ? `Requires: ${option.need}` : `Not enabled — needs ${option.need}`}</p>
                  </button>
                ))}
              </div>

              {current !== "NONE" && (
                <div className="rounded-2xl border border-border p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">Publishing</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">Address name: <b className="text-foreground">{info.slug}</b> (the salon can change it)</p>
                      {info.urls.live ? (
                        <a className="mt-1 block truncate text-sm font-medium text-primary underline" href={info.urls.live} target="_blank" rel="noopener noreferrer">{info.urls.live}</a>
                      ) : (
                        <p className="mt-1 text-xs text-amber-700">No public address yet — set PUBLIC_ROOT_DOMAIN on the API server so sites get https://name.yourdomain.com.</p>
                      )}
                    </div>
                    <button disabled={busy} onClick={() => void put({ isPublished: !published }, published ? "Website unpublished." : "Website published.")} className={published ? "rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-muted/60 disabled:opacity-50" : buttonClass}>
                      {busy ? "Working…" : published ? "Unpublish" : "Publish website"}
                    </button>
                  </div>
                  {current === "CUSTOM" && <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">Custom sites use the salon&apos;s API key (created by the salon in <b>API & Integrations</b>) and allowed domains. Publishing enables that key for public bookings.</p>}
                </div>
              )}

              {current !== "NONE" && (
                <div className="rounded-2xl border border-border p-5">
                  <h3 className="font-semibold">Custom domain</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">Optional. The salon usually connects this itself from its dashboard; you can do it on their behalf.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="www.yoursalon.com" className={`${inputClass} max-w-sm`} aria-label="Custom domain" />
                    <button disabled={busy || !domain.trim() || domain.trim() === info.settings?.customDomain} onClick={() => void put({ customDomain: domain }, "Domain saved — DNS records generated.")} className={buttonClass}>Connect</button>
                    {info.settings?.customDomain && <button disabled={busy} onClick={() => void put({ customDomain: null }, "Domain removed.")} className={outlineButtonClass}>Remove</button>}
                    {info.settings?.customDomain && <button disabled={busy} onClick={() => void act(() => api<WebsiteInfo>(`/api/platform/salons/${salon.id}/website/verify-domain`, { method: "POST" }), "DNS checked.")} className={outlineButtonClass}>Check DNS now</button>}
                  </div>
                  {info.settings?.customDomain && (
                    <div className="mt-4 space-y-3 text-sm">
                      <p>Status: <b>{{ NONE: "Not connected", PENDING_DNS: "Waiting for DNS", VERIFYING: "Verifying / issuing SSL", ACTIVE: "Live", FAILED: "Needs attention" }[status]}</b>{info.settings.domainError && status !== "ACTIVE" ? <span className="text-muted-foreground"> — {info.settings.domainError}</span> : null}</p>
                      {info.dns && (
                        <div className="overflow-x-auto rounded-xl bg-muted/60 p-3 font-mono text-xs">
                          <p>CNAME&nbsp; {info.dns.cname.host} → {info.dns.cname.value}</p>
                          <p>TXT&nbsp;&nbsp;&nbsp;&nbsp; {info.dns.txt.host} = {info.dns.txt.value}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          <div className="flex justify-between gap-3">
            <button onClick={onBack} className={outlineButtonClass}>Back to control centre</button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

function TemplateWebsiteBlocked({
  salon,
  subscription,
  missingFeatures,
  onGrant,
  onBack,
  onClose,
}: {
  salon: Salon;
  subscription: SalonSubscription;
  missingFeatures: string[];
  onGrant: () => Promise<void>;
  onBack: () => void;
  onClose: () => void;
}) {
  const [granting, setGranting] = useState(false);
  const grant = async () => {
    setGranting(true);
    try {
      await onGrant();
    } finally {
      setGranting(false);
    }
  };
  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-2xl rounded-t-3xl bg-card shadow-2xl sm:rounded-2xl">
        <header className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-800">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Website Integration
              </p>
              <h2 className="text-xl font-bold">{salon.salonName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted/60"
          >
            <X />
          </button>
        </header>
        <div className="p-6">
          <h3 className="text-lg font-bold">
            Template website is not enabled yet
          </h3>
          <p className="mt-2 text-sm text-foreground/70">
            The Publish button is disabled because this salon does not currently
            have the required access. Subscription status:{" "}
            <b>{subscription?.status ?? "No subscription"}</b>.
          </p>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">
              Missing requirements
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {missingFeatures.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-amber-900"
                >
                  {feature.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-5 text-sm text-foreground/70">
            Granting access creates salon-level feature overrides. Use this only
            when the salon&apos;s plan or approved upgrade allows a template website.
          </p>
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button
              onClick={onBack}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground/80"
            >
              Back to control centre
            </button>
            <button
              disabled={granting || subscription === null}
              onClick={() => void grant()}
              className={buttonClass}
            >
              {granting ? "Enabling..." : "Enable template website access"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

function PlanEditor({
  plan,
  onClose,
  onSaved,
}: {
  plan: Plan | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError("");
  }, [error]);
  useEffect(() => {
    void api<Feature[]>("/api/platform/features")
      .then(setFeatures)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load features."),
      );
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const featureCodes = form.getAll("feature").map(String);
    const payload = {
      code: String(form.get("code")).trim().toUpperCase(),
      name: String(form.get("name")).trim(),
      description: String(form.get("description")).trim() || null,
      monthlyPrice:
        form.get("monthlyPrice") === ""
          ? null
          : Number(form.get("monthlyPrice")),
      annualPrice:
        form.get("annualPrice") === "" ? null : Number(form.get("annualPrice")),
      isActive: form.get("isActive") === "on",
    };
    setSaving(true);
    setError("");
    try {
      const saved = await api<Plan>(
        plan ? `/api/platform/plans/${plan.id}` : "/api/platform/plans",
        { method: plan ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      await api(`/api/platform/plans/${saved.id}/features`, {
        method: "PUT",
        body: JSON.stringify({ featureCodes }),
      });
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save plan.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <ModalOverlay onClose={onClose}>
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {plan ? "Edit plan" : "Create plan"}
          </h2>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            required
            name="code"
            defaultValue={plan?.code}
            placeholder="PLAN_CODE"
            className="rounded-xl border px-3 py-2.5"
          />
          <input
            required
            type="text"
            name="name"
            defaultValue={plan?.name}
            pattern=".*[A-Za-z].*"
            title="Plan name must contain at least one letter."
            placeholder="Plan name"
            className="rounded-xl border px-3 py-2.5"
          />
          <input
            name="monthlyPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={plan?.monthlyPrice ?? ""}
            placeholder="Monthly price"
            className="rounded-xl border px-3 py-2.5"
          />
          <input
            name="annualPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Annual price"
            className="rounded-xl border px-3 py-2.5"
          />
          <textarea
            name="description"
            defaultValue={plan?.description ?? ""}
            placeholder="Description"
            className={`${inputClass} min-h-24 py-2.5 sm:col-span-2`}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={plan?.isActive ?? true}
            />{" "}
            Active plan
          </label>
        </div>
        <h3 className="mt-6 font-semibold">Feature entitlement</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {features.map((feature) => (
            <label
              key={feature.id}
              className="flex items-center gap-2 rounded-xl border p-3 text-sm"
            >
              <input
                name="feature"
                type="checkbox"
                value={feature.code}
                defaultChecked={plan?.features?.some(
                  (item) => item.feature.code === feature.code,
                )}
              />
              {feature.name}
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button disabled={saving} className={buttonClass}>
            {saving ? "Saving…" : "Save plan"}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
