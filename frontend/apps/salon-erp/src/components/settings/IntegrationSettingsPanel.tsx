"use client";

import { useEffect, useState } from "react";
import { Copy, CreditCard, KeyRound, RefreshCw, Save } from "lucide-react";
import { useERPStore } from "@/src/lib/erp-store";
import { erpApi } from "@/src/lib/erp-store";
import { Unavailable } from "./WebsiteSettingsPanel";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";
const parseDomains = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function IntegrationSettingsPanel() {
  const {
    features,
    integration,
    fetchIntegration,
    createIntegration,
    updateIntegration,
    rotateIntegrationKey,
  } = useERPStore();
  useEffect(() => {
    void fetchIntegration();
  }, [fetchIntegration]);

  if (!features.includes("API_INTEGRATIONS"))
    return (
      <Unavailable title="API integrations are not included in this plan." />
    );

  return (
    <IntegrationForm
      key={integration?.id ?? "new"}
      integration={integration}
      createIntegration={createIntegration}
      updateIntegration={updateIntegration}
      rotateIntegrationKey={rotateIntegrationKey}
    />
  );
}

function IntegrationForm({
  integration,
  createIntegration,
  updateIntegration,
  rotateIntegrationKey,
}: {
  integration: ReturnType<typeof useERPStore.getState>["integration"];
  createIntegration: (allowedDomains: string[]) => Promise<void>;
  updateIntegration: (
    id: string,
    input: { allowedDomains: string[]; isActive: boolean },
  ) => Promise<void>;
  rotateIntegrationKey: (id: string) => Promise<void>;
}) {
  const [domains, setDomains] = useState(
    () => integration?.allowedDomains.join("\n") ?? "",
  );
  const copyKey = async () => {
    if (integration?.publicKey)
      await navigator.clipboard.writeText(integration.publicKey);
  };
  const save = () => {
    const allowedDomains = parseDomains(domains);
    if (integration)
      void updateIntegration(integration.id, {
        allowedDomains,
        isActive: integration.isActive,
      });
    else void createIntegration(allowedDomains);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950 text-white">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-950">
              Website integration
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Allow a custom website to use the public booking API safely.
            </p>
          </div>
        </div>
      </header>
      <section className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-800">
            Allowed domains
          </span>
          <textarea
            value={domains}
            onChange={(event) => setDomains(event.target.value)}
            rows={5}
            placeholder={"www.yoursalon.com\nbooking.yoursalon.com"}
            className={inputClass}
          />
          <span className="text-xs text-zinc-500">
            One domain per line. Include the port for local testing, for example
            localhost:3002.
          </span>
        </label>
        {integration && (
          <>
            <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-50 p-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Integration status
                </p>
                <p className="text-xs text-zinc-500">
                  Disable this to immediately block public API access.
                </p>
              </div>
              <input
                aria-label="Integration active"
                type="checkbox"
                checked={integration.isActive}
                onChange={(event) =>
                  void updateIntegration(integration.id, {
                    allowedDomains: parseDomains(domains),
                    isActive: event.target.checked,
                  })
                }
                className="h-4 w-4"
              />
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">
                Public API key
              </p>
              <div className="mt-2 flex gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 text-xs text-zinc-800">
                  {integration.publicKey}
                </code>
                <button
                  type="button"
                  onClick={() => void copyKey()}
                  className="rounded-lg border bg-white px-3 text-zinc-700 hover:bg-zinc-100"
                  title="Copy key"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-amber-800">
                Treat this key as a website credential. Rotate it if it is
                exposed.
              </p>
            </div>
          </>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <Save className="h-4 w-4" />
            {integration ? "Save integration" : "Create integration key"}
          </button>
          {integration && (
            <button
              type="button"
              onClick={() => void rotateIntegrationKey(integration.id)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <RefreshCw className="h-4 w-4" />
              Rotate key
            </button>
          )}
        </div>
      </section>
      <PaymentGatewaySettings />
    </div>
  );
}

export function PaymentGatewaySettings() {
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void erpApi<{ configured: boolean; keyId: string }>("/payment-integration")
      .then((value) => {
        setConfigured(value.configured);
        setKeyId(value.keyId);
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  const savePaymentGateway = async () => {
    setMessage("");
    try {
      await erpApi("/payment-integration", {
        method: "PUT",
        body: JSON.stringify({ keyId, keySecret, webhookSecret }),
      });
      setKeySecret("");
      setWebhookSecret("");
      setConfigured(true);
      setMessage("Razorpay is connected. Customer payments will settle directly to this salon.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not connect Razorpay.");
    }
  };

  return (
    <section className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950 text-white"><CreditCard className="h-6 w-6" /></div>
        <div><h2 className="text-lg font-bold text-zinc-950">Online payments</h2><p className="mt-1 text-sm text-zinc-500">Connect this salon&apos;s Razorpay account. Secrets are encrypted and never shown again.</p></div>
      </div>
      {configured && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Razorpay is connected. Enter all values again only to replace the connection.</p>}
      {message && <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">{message}</p>}
      <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-800">Razorpay Key ID</span><input value={keyId} onChange={(event) => setKeyId(event.target.value)} className={inputClass} placeholder="rzp_test_…" autoComplete="off" /></label>
      <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-800">Razorpay Key Secret</span><input value={keySecret} onChange={(event) => setKeySecret(event.target.value)} className={inputClass} type="password" placeholder="Enter the secret from Razorpay" autoComplete="new-password" /></label>
      <label className="block space-y-2"><span className="text-sm font-semibold text-zinc-800">Webhook secret</span><input value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} className={inputClass} type="password" placeholder="Create this in Razorpay webhook settings" autoComplete="new-password" /></label>
      <p className="text-xs text-zinc-500">In Razorpay, create a webhook pointing to <code>/api/webhooks/razorpay/salon</code> and subscribe to <code>payment.captured</code>.</p>
      <button type="button" onClick={() => void savePaymentGateway()} disabled={!keyId || !keySecret || !webhookSecret} className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />Save Razorpay connection</button>
    </section>
  );
}
