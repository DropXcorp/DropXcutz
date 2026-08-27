"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
type Website = { type: "NONE" | "TEMPLATE" | "CUSTOM"; title?: string | null; description?: string | null; customDomain?: string | null };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/erp${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Request failed.");
  return body.data;
}

export default function WebsiteSettingsPage() {
  const [website, setWebsite] = useState<Website>({ type: "NONE" });
  const [status, setStatus] = useState("Loading website settings…");
  const [saving, setSaving] = useState(false);
  useEffect(() => { void api<Website | null>("/website-settings").then((data) => { setWebsite(data ?? { type: "NONE" }); setStatus(""); }).catch((error) => setStatus(error.message)); }, []);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setStatus("");
    try { const saved = await api<Website>("/website-settings", { method: "PUT", body: JSON.stringify(website) }); setWebsite(saved); setStatus("Website settings saved."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not save settings."); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save} className="max-w-2xl space-y-6">
    <div><h1 className="text-2xl font-bold">Website management</h1><p className="mt-1 text-sm text-zinc-500">Choose how your salon is published and keep its public details current.</p></div>
    {status && <p role="status" className="rounded-xl bg-zinc-100 p-3 text-sm text-zinc-700">{status}</p>}
    <section className="space-y-4 rounded-3xl border bg-white p-6 shadow-sm">
      <label className="block text-sm font-medium">Website type<select value={website.type} onChange={(event) => setWebsite({ ...website, type: event.target.value as Website["type"] })} className="mt-2 w-full rounded-xl border px-3 py-2.5"><option value="NONE">Not published</option><option value="TEMPLATE">DropXcutz template website</option><option value="CUSTOM">Custom website</option></select></label>
      <label className="block text-sm font-medium">Page title<input value={website.title ?? ""} onChange={(event) => setWebsite({ ...website, title: event.target.value })} maxLength={160} className="mt-2 w-full rounded-xl border px-3 py-2.5" /></label>
      <label className="block text-sm font-medium">Description<textarea value={website.description ?? ""} onChange={(event) => setWebsite({ ...website, description: event.target.value })} className="mt-2 min-h-28 w-full rounded-xl border px-3 py-2.5" /></label>
      {website.type === "CUSTOM" && <label className="block text-sm font-medium">Custom domain<input value={website.customDomain ?? ""} onChange={(event) => setWebsite({ ...website, customDomain: event.target.value })} placeholder="booking.example.com" className="mt-2 w-full rounded-xl border px-3 py-2.5" /></label>}
    </section>
    <button disabled={saving} className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save website settings"}</button>
  </form>;
}
