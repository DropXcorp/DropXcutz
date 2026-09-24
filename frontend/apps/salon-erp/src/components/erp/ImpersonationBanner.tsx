"use client";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { erpApi, useERPStore } from "@/src/lib/erp-store";

function formatRemaining(expiresAt: string, now: number) {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "expiring now";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ImpersonationBanner() {
  const impersonation = useERPStore((state) => state.impersonation);
  const currentSalon = useERPStore((state) => state.currentSalon);
  const resetSession = useERPStore((state) => state.resetSession);
  const [now, setNow] = useState(() => Date.now());
  const [ending, setEnding] = useState(false);

  const active = Boolean(impersonation);
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [active]);

  const remaining = impersonation ? formatRemaining(impersonation.expiresAt, now) : "";

  if (!impersonation) return null;

  async function endImpersonation() {
    if (ending) return;
    setEnding(true);
    try {
      await erpApi("/auth/stop-impersonation", { method: "POST" });
    } catch {
      // session is being torn down regardless; fall through to leaving the tab
    } finally {
      resetSession();
      if (window.opener) window.close();
      else window.location.href = "/";
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>
          Viewing {currentSalon?.name ?? "this salon"} as support — impersonated by{" "}
          {impersonation.adminName}. Session ends in {remaining}.
        </span>
      </div>
      <button
        type="button"
        onClick={endImpersonation}
        disabled={ending}
        className="shrink-0 rounded-lg bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 transition hover:bg-amber-900 disabled:cursor-wait disabled:opacity-60"
      >
        {ending ? "Ending…" : "Return to admin"}
      </button>
    </div>
  );
}
