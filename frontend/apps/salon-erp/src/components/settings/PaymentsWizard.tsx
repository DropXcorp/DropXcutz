"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Copy, CreditCard, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { erpApi, useERPStore } from "@/src/lib/erp-store";

type Status = {
  configured: boolean;
  keyId: string;
  mode: "test" | "live" | null;
  enabled: boolean;
  webhookUrl: string;
  lastWebhook: { at: string; event: string; error: string | null } | null;
};

const field = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30";
const label = "mb-1.5 block text-xs font-semibold text-foreground/80";
const card = "rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border";
const say = {
  ok: (message: string) => useERPStore.setState({ successMessage: message, error: null }),
  fail: (cause: unknown) => useERPStore.setState({ error: cause instanceof Error ? cause.message : "Something went wrong." }),
};

function CopyRow({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs">
      <span className="truncate">{value}</span>
      <button type="button" aria-label="Copy" className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={() => void navigator.clipboard.writeText(value).then(() => { setDone(true); window.setTimeout(() => setDone(false), 1500); })}>
        {done ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

export default function PaymentsWizard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "test" | "toggle" | "disconnect" | null>(null);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await erpApi<Status>("/payment-integration");
      setStatus(next);
      setKeyId(next.keyId);
    } catch (cause) {
      say.fail(cause);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (kind: NonNullable<typeof busy>, task: () => Promise<Status | void>, success: string) => {
    setBusy(kind);
    try {
      const result = await task();
      if (result) setStatus(result);
      say.ok(success);
      return true;
    } catch (cause) {
      say.fail(cause);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const connect = async () => {
    const ok = await run("save", () => erpApi<Status>("/payment-integration", { method: "PUT", body: JSON.stringify({ keyId: keyId.trim(), keySecret: keySecret.trim(), webhookSecret: webhookSecret.trim() }) }), "Razorpay connected — your keys were verified.");
    if (ok) { setKeySecret(""); setWebhookSecret(""); setEditing(false); }
  };

  if (loading) return <div className="mx-auto max-w-3xl space-y-4"><div className="h-28 animate-pulse rounded-2xl bg-muted/60" /><div className="h-64 animate-pulse rounded-2xl bg-muted/60" /></div>;
  const connected = Boolean(status?.configured);
  const showForm = !connected || editing;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <header className={`${card} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><CreditCard className="size-6" /></div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Online payments</h1>
            <p className="text-sm text-muted-foreground">Customers pay on your website; money goes straight to your Razorpay account.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected && status?.mode && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.mode === "live" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{status.mode === "live" ? "Live mode" : "Test mode"}</span>}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{connected ? "Connected" : "Not connected"}</span>
        </div>
      </header>

      {connected && status && (
        <section className={`${card} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Accept online payments</h2>
              <p className="text-xs text-muted-foreground">When off, your website takes bookings as “pay at the salon”.</p>
            </div>
            <button type="button" role="switch" aria-checked={status.enabled} disabled={busy !== null}
              onClick={() => void run("toggle", () => erpApi<Status>("/payment-integration/settings", { method: "PATCH", body: JSON.stringify({ enabled: !status.enabled }) }), status.enabled ? "Online payments turned off." : "Online payments turned on.")}
              className={`relative h-6 w-11 rounded-full transition ${status.enabled ? "bg-primary" : "bg-muted-foreground/40"} disabled:opacity-50`}>
              <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${status.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
          {status.mode === "test" && <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><TriangleAlert className="mt-0.5 size-4 shrink-0" />You&apos;re using Razorpay <b>test</b> keys — no real money moves. Switch to live keys when you&apos;re ready.</p>}
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button variant="outline" disabled={busy !== null} onClick={() => void run("test", async () => { await erpApi("/payment-integration/test", { method: "POST" }); }, "Keys are valid and working.")}>
              {busy === "test" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Test connection
            </Button>
            <Button variant="outline" disabled={busy !== null} onClick={() => setEditing((value) => !value)}>{editing ? "Cancel" : "Replace keys"}</Button>
            <Button variant="destructive" disabled={busy !== null} onClick={() => setConfirmDisconnect(true)}>Disconnect</Button>
          </div>
        </section>
      )}

      {showForm && (
        <section className={`${card} space-y-4`}>
          <div>
            <h2 className="font-semibold">{connected ? "Replace Razorpay keys" : "Connect your Razorpay account"}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Find these in Razorpay Dashboard → Account & Settings → API Keys. Secrets are encrypted and never shown again. We verify the keys before saving.</p>
          </div>
          <div><label className={label} htmlFor="rz-key">Key ID</label><input id="rz-key" className={field} value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="rzp_test_…" autoComplete="off" /></div>
          <div><label className={label} htmlFor="rz-secret">Key Secret</label><input id="rz-secret" type="password" className={field} value={keySecret} onChange={(e) => setKeySecret(e.target.value)} autoComplete="new-password" /></div>
          <div><label className={label} htmlFor="rz-hook">Webhook secret</label><input id="rz-hook" type="password" className={field} value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} autoComplete="new-password" placeholder="You choose this when creating the webhook (step below)" /></div>
          <Button disabled={busy !== null || !keyId.trim() || !keySecret.trim() || !webhookSecret.trim()} onClick={() => void connect()}>
            {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Verify & connect
          </Button>
        </section>
      )}

      <section className={`${card} space-y-3`}>
        <h2 className="font-semibold">Set up the webhook <span className="text-xs font-normal text-muted-foreground">(so payments confirm automatically)</span></h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>In Razorpay: Account & Settings → <b>Webhooks</b> → Add new webhook.</li>
          <li>Paste this URL:</li>
        </ol>
        {status && <CopyRow value={status.webhookUrl} />}
        <ol start={3} className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Choose a secret (same one you enter above) and tick <b>payment.captured</b>, <b>payment.failed</b> and <b>order.paid</b>.</li>
        </ol>
        <div className={`rounded-lg px-3 py-2 text-sm ${status?.lastWebhook ? (status.lastWebhook.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800") : "bg-muted/50 text-muted-foreground"}`}>
          {status?.lastWebhook
            ? `Last webhook: ${status.lastWebhook.event} · ${new Date(status.lastWebhook.at).toLocaleString("en-IN")}${status.lastWebhook.error ? " · failed to process" : " · processed"}`
            : "No webhook received yet. Make a small test payment on your website to confirm everything is wired up."}
        </div>
        <p className="text-xs text-muted-foreground">See collected payments and refunds in <Link className="underline" href="/payments">Payments</Link>. Customers get email confirmations automatically.</p>
      </section>

      <AlertDialog open={confirmDisconnect} onOpenChange={(open) => busy === null && setConfirmDisconnect(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Razorpay?</AlertDialogTitle>
            <AlertDialogDescription>Your website will switch to “pay at the salon” until you connect again. Existing payments are not affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmDisconnect(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy !== null} onClick={() => void run("disconnect", () => erpApi<Status>("/payment-integration", { method: "DELETE" }), "Razorpay disconnected.").then((ok) => { if (ok) { setConfirmDisconnect(false); setKeyId(""); } })}>Disconnect</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
