"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { browserApiUrl } from "@/lib/config";
import { money } from "@/lib/site";

type View = {
  id: string;
  appointmentNumber: string;
  status: string;
  paymentStatus: string;
  scheduledAt: string;
  salonName: string;
  salonPhone: string | null;
  services: { name: string; price: number }[];
  stylist: string | null;
  total: number;
  due: number;
  holdExpiresAt: string | null;
  cancellable: boolean;
  cancellationWindowHours: number;
};
type CheckoutOrder = { orderId: string; keyId: string; amount: number; currency: string; appointmentNumber: string; customer?: { name: string; email?: string | null; contact?: string | null } };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

async function api<T>(slug: string, id: string, token: string, path = "", init?: RequestInit): Promise<T> {
  const response = await fetch(`${browserApiUrl}/public/v1/salons/${slug}/appointments/${id}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "X-Booking-Token": token, ...init?.headers },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "We couldn't load this booking.");
  return body?.data as T;
}

// scheduledAt stores the salon's wall-clock time as UTC, so render it in UTC.
const when = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));

export default function ManageBooking({ slug, id, token, flash, primary, paymentsOn }: { slug: string; id: string; token: string; flash?: "paid" | "booked"; primary: string; paymentsOn: boolean }) {
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [now] = useState(() => Date.now());
  const [notice, setNotice] = useState(flash === "paid" ? "Payment received — you're all set!" : flash === "booked" ? "Your booking is confirmed." : "");

  const load = useCallback(async () => {
    try {
      setView(await api<View>(slug, id, token));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this booking.");
    }
  }, [slug, id, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      setView(await api<View>(slug, id, token, "/cancel", { method: "POST" }));
      setNotice("Your booking has been cancelled.");
      setConfirmCancel(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel.");
    } finally {
      setBusy(false);
    }
  };

  const payNow = async () => {
    setBusy(true);
    setError("");
    try {
      const order = await api<CheckoutOrder>(slug, id, token, "/payment-order", { method: "POST" });
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Could not load the payment form."));
          document.head.appendChild(script);
        });
      }
      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay!({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: view?.salonName,
          description: `Appointment ${order.appointmentNumber}`,
          prefill: order.customer,
          theme: { color: primary },
          modal: { ondismiss: () => reject(new Error("Payment was not completed.")) },
          handler: async (result: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await api(slug, id, token, "/payment-verify", { method: "POST", body: JSON.stringify({ orderId: result.razorpay_order_id, paymentId: result.razorpay_payment_id, signature: result.razorpay_signature }) });
              resolve();
            } catch (cause) {
              reject(cause);
            }
          },
        });
        checkout.open();
      });
      setNotice("Payment received — thank you!");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!view && !error) return <div className="panel"><p className="muted">Loading your booking…</p></div>;
  if (!view) return <div className="panel"><h2>We couldn&apos;t open this booking</h2><p role="alert" className="alert error">{error}</p></div>;

  const cancelled = view.status === "CANCELLED";
  const holdActive = view.holdExpiresAt && new Date(view.holdExpiresAt).getTime() > now;
  const canPay = paymentsOn && !cancelled && view.due > 0 && view.paymentStatus !== "PAID" && (view.holdExpiresAt === null || holdActive);

  return (
    <div className="panel">
      {notice && <p role="status" className="alert ok">{notice}</p>}
      {error && <p role="alert" className="alert error">{error}</p>}
      <div className="row"><h2>Booking {view.appointmentNumber}</h2><span className={`badge ${cancelled ? "danger" : ""}`}>{view.status.replace("_", " ").toLowerCase()}</span></div>
      <div className="summary">
        <div><span className="muted small">When</span><b>{when(view.scheduledAt)}</b></div>
        <div><span className="muted small">Services</span><b>{view.services.map((item) => item.name).join(", ")}</b></div>
        {view.stylist && <div><span className="muted small">Specialist</span><b>{view.stylist}</b></div>}
        <div><span className="muted small">Total</span><b>{money(view.total)} · {view.paymentStatus.replace("_", " ").toLowerCase()}</b></div>
      </div>
      <div className="actions">
        {canPay && <button className="btn" disabled={busy} onClick={() => void payNow()}>{busy ? "Working…" : `Pay ${money(view.due)}`}</button>}
        {view.cancellable && !confirmCancel && <button className="btn ghost dark" onClick={() => setConfirmCancel(true)}>Cancel booking</button>}
        {view.salonPhone && <a className="btn ghost dark" href={`tel:${view.salonPhone}`}>Call salon</a>}
      </div>
      {confirmCancel && (
        <div className="alert warn">
          <p>Cancel this booking? This can&apos;t be undone.</p>
          <div className="actions"><button className="btn danger" disabled={busy} onClick={() => void cancel()}>{busy ? "Cancelling…" : "Yes, cancel"}</button><button className="btn ghost dark" onClick={() => setConfirmCancel(false)}>Keep booking</button></div>
        </div>
      )}
      {!view.cancellable && !cancelled && view.status !== "COMPLETED" && <p className="muted small">Online cancellation closes {view.cancellationWindowHours} hours before your appointment. Please call the salon for changes.</p>}
    </div>
  );
}
