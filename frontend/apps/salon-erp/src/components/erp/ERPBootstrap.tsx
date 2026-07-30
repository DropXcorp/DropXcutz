"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useERPStore } from "@/src/lib/erp-store";
const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
export default function ERPBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hydrate, loading, hydrated, error, clearError } = useERPStore();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch(`${api}/erp/auth/me`, { credentials: "include" })
      .then((r) => {
        setSignedIn(r.ok);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);
  useEffect(() => {
    if (signedIn) void hydrate();
  }, [signedIn, hydrate]);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${api}/erp/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setMessage(body?.error ?? "Unable to sign in.");
      return;
    }
    setMessage("");
    setSignedIn(true);
  }
  if (!ready)
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-zinc-500">
        Loading�
      </div>
    );
  if (!signedIn)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <form
          onSubmit={login}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              DropXCutz
            </p>
            <h1 className="mt-1 text-2xl font-bold">Salon sign in</h1>
          </div>
          {message && <p className="text-sm text-red-600">{message}</p>}
          <input
            required
            name="email"
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5"
          />
          <input
            required
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5"
          />
          <button className="w-full rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white">
            Sign in
          </button>
        </form>
      </div>
    );
  return (
    <>
      {error && (
        <div className="flex items-center justify-between bg-red-600 px-4 py-2 text-sm text-white">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Dismiss error">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {loading && !hydrated ? (
        <div className="grid min-h-[60vh] place-items-center text-sm text-zinc-500">
          Loading salon data�
        </div>
      ) : (
        children
      )}
    </>
  );
}
