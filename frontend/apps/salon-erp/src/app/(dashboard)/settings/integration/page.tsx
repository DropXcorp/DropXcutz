"use client";

import { useEffect, useState } from "react";
import { Copy, Globe, KeyRound, Plus, RefreshCw, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
type Integration = { id: string; publicKey: string; allowedDomains: string[]; isActive: boolean };

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/erp${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }, ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Request failed");
  return body.data;
}

export default function WebsiteIntegrationPage() {
  const [integration, setIntegration] = useState<Integration | null>();
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => { try { setIntegration(await api<Integration | null>("/integrations/website")); } catch (e) { setError(e instanceof Error ? e.message : "Could not load integration."); } };
  useEffect(() => { void load(); }, []);
  const save = async (next: Partial<Integration>) => {
    if (!integration) return;
    setBusy(true); setError("");
    try { setIntegration(await api<Integration>(`/integrations/website/${integration.id}`, { method: "PATCH", body: JSON.stringify(next) })); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save changes."); } finally { setBusy(false); }
  };
  const create = async () => { setBusy(true); try { setIntegration(await api<Integration>("/integrations/website", { method: "POST", body: JSON.stringify({ allowedDomains: [] }) })); } catch (e) { setError(e instanceof Error ? e.message : "Could not create integration."); } finally { setBusy(false); } };
  if (integration === undefined) return <p className="text-sm text-zinc-500">Loading website integration…</p>;
  if (!integration) return <div className="max-w-2xl rounded-3xl border bg-white p-7 shadow-sm"><Globe className="mb-4 h-8 w-8" /><h1 className="text-2xl font-bold">Website integration</h1><p className="mt-2 text-sm text-zinc-500">Connect your existing salon website securely to live booking data.</p>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<button disabled={busy} onClick={() => void create()} className="mt-6 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Create integration key</button></div>;
  const keyVisible = !integration.publicKey.includes("•");
  return <div className="max-w-3xl space-y-6"><div><h1 className="text-2xl font-bold text-zinc-950">Website integration</h1><p className="mt-1 text-sm text-zinc-500">Allow your external website to retrieve booking data and create appointments.</p></div>{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<section className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Integration status</h2><p className="text-sm text-zinc-500">{integration.isActive ? "Your website can connect." : "Website requests are disabled."}</p></div><button disabled={busy} onClick={() => void save({ isActive: !integration.isActive })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${integration.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>{integration.isActive ? "Active" : "Inactive"}</button></div><div className="mt-6"><label className="text-sm font-medium">Public API key</label><div className="mt-2 flex gap-2"><code className="min-w-0 flex-1 overflow-hidden text-ellipsis rounded-xl bg-zinc-100 px-3 py-2.5 text-sm">{integration.publicKey}</code><button disabled={!keyVisible} onClick={() => void navigator.clipboard.writeText(integration.publicKey)} className="rounded-xl border px-3 disabled:opacity-40" title={keyVisible ? "Copy key" : "Rotate the key to reveal a new value"}><Copy className="h-4 w-4" /></button><button disabled={busy} onClick={async () => { if (!confirm("Rotate this key? Your current website will stop working until updated.")) return; setBusy(true); try { setIntegration(await api<Integration>(`/integrations/website/${integration.id}/rotate-key`, { method: "POST" })); } catch (e) { setError(e instanceof Error ? e.message : "Could not rotate key."); } finally { setBusy(false); } }} className="rounded-xl border px-3" title="Rotate key"><RefreshCw className="h-4 w-4" /></button></div>{!keyVisible && <p className="mt-2 text-xs text-zinc-500">For security, existing keys are masked. Rotate the key to reveal a replacement.</p>}</div></section><section className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="font-semibold">Allowed domains</h2><p className="mt-1 text-sm text-zinc-500">Only these domains may use this key. Add domains without https://.</p><div className="mt-4 flex gap-2"><input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="booking.example.com" className="flex-1 rounded-xl border px-3 py-2 text-sm"/><button disabled={!domain.trim() || busy} onClick={() => { const next = [...integration.allowedDomains, domain.trim()]; setDomain(""); void save({ allowedDomains: next }); }} className="rounded-xl bg-zinc-950 px-3 text-white"><Plus className="h-4 w-4" /></button></div><ul className="mt-4 space-y-2">{integration.allowedDomains.map((item) => <li key={item} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm"><span>{item}</span><button disabled={busy} onClick={() => void save({ allowedDomains: integration.allowedDomains.filter((domain) => domain !== item) })}><Trash2 className="h-4 w-4 text-zinc-500" /></button></li>)}</ul></section><section className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4"/>Quick start</h2><pre className="mt-3 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100">{`fetch("${API_URL}/v1/public/services", {\n  headers: { "X-DropXcutz-Key": "${keyVisible ? integration.publicKey : "YOUR_PUBLIC_KEY"}" }\n})`}</pre></section></div>;
}
