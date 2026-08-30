"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LoaderCircle, X } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useERPStore, type ERPUser, type ERPSalon } from "@/src/lib/erp-store";
const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
export default function ERPBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {

  const { hydrate, loading, hydrated, error, clearError, resetSession, setIdentity } =
    useERPStore();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [message, setMessage] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  useEffect(() => {
    if (!error) return;
    toast.error(error);
    if (/sign in is required|session is invalid|session.*expired/i.test(error)) {
      void fetch(`${api}/erp/auth/logout`, { method: "POST", credentials: "include" }).finally(() => {
        resetSession();
        setMustChangePassword(false);
        setSignedIn(false);
      });
    }
    clearError();
  }, [error, clearError, resetSession]);
  const successMessage = useERPStore((state) => state.successMessage);
  const clearSuccess = useERPStore((state) => state.clearSuccess);
  useEffect(() => {
    if (!successMessage) return;
    toast.success(successMessage);
    clearSuccess();
  }, [successMessage, clearSuccess]);
  useEffect(() => {
    fetch(`${api}/erp/auth/me`, { credentials: "include" })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as {
          data?: { user?: ERPUser; salon?: ERPSalon | null };
        } | null;
        const validSalonSession = Boolean(
          response.ok && body?.data?.user && body.data.salon && body.data.user.role !== "PLATFORM_ADMIN",
        );
        if (validSalonSession && body?.data?.user && body.data.salon) {
          setIdentity(body.data.user, body.data.salon);
          setMustChangePassword(Boolean(body.data.user.mustChangePassword));
        }
        setSignedIn(validSalonSession);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [setIdentity]);
  useEffect(() => {
    if (signedIn) void hydrate();
  }, [signedIn, hydrate]);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authSubmitting) return;
    const form = new FormData(event.currentTarget);
    setAuthSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`${api}/erp/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { user?: ERPUser; salon?: ERPSalon | null };
        error?: string;
      } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "Unable to sign in.");
        return;
      }
      if (!body?.data?.user || !body.data.salon || body.data.user.role === "PLATFORM_ADMIN") {
        await fetch(`${api}/erp/auth/logout`, { method: "POST", credentials: "include" });
        setMessage("This account is for Super Admin. Please use a salon administrator account.");
        return;
      }
      setIdentity(body.data.user, body.data.salon);
      setMustChangePassword(Boolean(body.data.user.mustChangePassword));
      setSignedIn(true);
    } catch {
      setMessage("Unable to reach the server. Check your connection and try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }
  if (!ready)
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-zinc-500" role="status">
        <span className="flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" /> Checking your session…</span>
      </div>
    );
  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authSubmitting) return;
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (newPassword.length < 8) {
      setMessage("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("The new passwords do not match.");
      return;
    }
    setAuthSubmitting(true);
    try {
      const response = await fetch(`${api}/erp/auth/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "Unable to change your password.");
        return;
      }
      setMessage("");
      setMustChangePassword(false);
      await hydrate();
    } catch {
      setMessage("Unable to reach the server. Check your connection and try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }
  if (mustChangePassword)
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-100 px-4 py-8">
        <form
          onSubmit={changePassword}
          className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              First-time setup
            </p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-950">
              Create your password
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Your temporary password worked. Set a private password before
              entering the salon workspace.
            </p>
          </div>
          {message && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </p>
          )}
          <div className="space-y-3">
            <input
              required
              name="currentPassword"
              type="password"
              placeholder="Temporary password"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-900"
            />
            <input
              required
              name="newPassword"
              type="password"
              minLength={8}
              placeholder="New password (8+ characters)"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-900"
            />
            <input
              required
              name="confirmPassword"
              type="password"
              minLength={8}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-900"
            />
          </div>
          <button type="submit" aria-busy={authSubmitting} disabled={authSubmitting} className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">
            {authSubmitting ? "Saving…" : "Continue to ERP"}
          </button>
        </form>
      </div>
    );
  if (!signedIn)
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-100 px-4 py-8">
        <motion.form
          onSubmit={login}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950 text-lg font-bold text-white">
              DX
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                DropXcutz ERP
              </p>
              <p className="text-sm text-zinc-500">Salon workspace</p>
            </div>
          </div>
          <div className="mt-10">
            <p className="text-sm font-semibold text-zinc-500">Welcome back</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
              Sign in to your salon
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Use the admin credentials provided by your platform administrator.
            </p>
          </div>
          {message && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {message}
            </p>
          )}
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-700">
                Email address
              </span>
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-700">
                Password
              </span>
              <input
                required
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none transition focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/10"
              />
            </label>
            <button type="submit" aria-busy={authSubmitting} disabled={authSubmitting} className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60">
              {authSubmitting ? "Signing in…" : "Sign in to ERP"}
            </button>
          </div>
        </motion.form>
      </main>
    );
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      {error && (
        <div className="flex items-center justify-between bg-red-600 px-4 py-2 text-sm text-white shadow-sm">
          <div className="flex items-center gap-3">
            <span>{error}</span>
            {error.includes("unavailable") || error.includes("session") || error.includes("Sign in") ? (
              <button
                type="button"
                onClick={async () => {
                  await fetch(`${api}/erp/auth/logout`, { method: "POST", credentials: "include" });
                  setSignedIn(false);
                  clearError();
                }}
                className="rounded bg-white/20 px-2 py-0.5 text-xs font-semibold text-white hover:bg-white/30 transition"
              >
                Sign In Again
              </button>
            ) : null}
          </div>
          <button type="button" onClick={clearError} aria-label="Dismiss error" className="hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {loading && !hydrated ? (
          <div className="grid min-h-[60vh] place-items-center text-sm text-zinc-500" role="status">
          <span className="flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading your workspace…</span>
        </div>
      ) : (
        children
      )}
    </>
  );
}
