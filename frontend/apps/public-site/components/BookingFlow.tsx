"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { browserApiUrl } from "@/lib/config";
import { formatTime, money, type SiteSalon, type SiteService } from "@/lib/site";

type Employee = { id: string; name: string; role: string };
type Booking = { id: string; appointmentNumber: string; manageToken: string; holdExpiresAt: string | null };
type CheckoutOrder = { orderId: string; keyId: string; amount: number; currency: string; appointmentNumber: string; customer?: { name: string; email?: string | null; contact?: string | null } };
type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const steps = ["Service", "Specialist", "Date & time", "Your details"] as const;
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

async function api<T>(slug: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${browserApiUrl}/public/v1/salons/${slug}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "We couldn't complete that request. Please try again.");
  return body?.data as T;
}

async function loadCheckout() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the secure payment form. Check your connection."));
    document.head.appendChild(script);
  });
  if (!window.Razorpay) throw new Error("Could not start the secure payment form.");
}

export default function BookingFlow({ slug, salon, services, initialServiceId, primary }: { slug: string; salon: SiteSalon; services: SiteService[]; initialServiceId?: string; primary: string }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services.some((item) => item.id === initialServiceId) ? (initialServiceId as string) : "");
  const [staff, setStaff] = useState<Employee[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(() => dateKey(new Date()));
  const [slots, setSlots] = useState<string[]>([]);
  const [slotNote, setSlotNote] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState("");
  const [details, setDetails] = useState({ name: "", phone: "", email: "", notes: "" });
  const [step, setStep] = useState(initialServiceId && services.some((item) => item.id === initialServiceId) ? 1 : 0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ booking: Booking; order?: CheckoutOrder } | null>(null);
  const [requestId] = useState(() => crypto.randomUUID());

  const service = useMemo(() => services.find((item) => item.id === serviceId), [services, serviceId]);
  const employee = staff.find((item) => item.id === employeeId);

  useEffect(() => {
    if (!serviceId) return;
    let active = true;
    setStaffLoading(true);
    api<Employee[]>(slug, `/employees?serviceId=${encodeURIComponent(serviceId)}`)
      .then((items) => {
        if (!active) return;
        setStaff(items);
        setEmployeeId((current) => (items.some((item) => item.id === current) ? current : ""));
      })
      .catch((cause: Error) => active && setError(cause.message))
      .finally(() => active && setStaffLoading(false));
    return () => {
      active = false;
    };
  }, [serviceId, slug]);

  useEffect(() => {
    if (!serviceId || !employeeId || !date) return;
    let active = true;
    setSlotsLoading(true);
    setTime("");
    api<{ slots: string[]; reason?: string }>(slug, `/availability?serviceId=${encodeURIComponent(serviceId)}&employeeId=${encodeURIComponent(employeeId)}&date=${date}`)
      .then((data) => {
        if (!active) return;
        setSlots(data.slots);
        setSlotNote(data.reason ?? "");
      })
      .catch((cause: Error) => active && setError(cause.message))
      .finally(() => active && setSlotsLoading(false));
    return () => {
      active = false;
    };
  }, [serviceId, employeeId, date, slug]);

  const goToManage = useCallback((booking: Booking, paid: boolean) => {
    router.push(`/manage/${booking.id}?token=${encodeURIComponent(booking.manageToken)}&${paid ? "paid=1" : "booked=1"}`);
  }, [router]);

  const pay = useCallback(async (booking: Booking) => {
    const order = await api<CheckoutOrder>(slug, `/appointments/${booking.id}/payment-order`, { method: "POST", headers: { "X-Booking-Token": booking.manageToken } });
    await loadCheckout();
    await new Promise<void>((resolve, reject) => {
      const checkout = new window.Razorpay!({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: salon.name,
        description: `Appointment ${order.appointmentNumber}`,
        prefill: order.customer ?? { name: details.name, contact: details.phone, email: details.email || undefined },
        theme: { color: primary },
        modal: { ondismiss: () => reject(new Error("Payment was not completed. Your slot is held for a few minutes — you can try again below.")) },
        handler: async (result: RazorpayResponse) => {
          try {
            await api(slug, `/appointments/${booking.id}/payment-verify`, {
              method: "POST",
              body: JSON.stringify({ orderId: result.razorpay_order_id, paymentId: result.razorpay_payment_id, signature: result.razorpay_signature }),
            });
            resolve();
          } catch (cause) {
            reject(cause);
          }
        },
      });
      checkout.open();
    });
    goToManage(booking, true);
  }, [details.email, details.name, details.phone, goToManage, primary, salon.name, slug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !serviceId || !employeeId || !time) return;
    setBusy(true);
    setError("");
    try {
      const booking = await api<Booking>(slug, "/appointments", {
        method: "POST",
        body: JSON.stringify({
          serviceId,
          employeeId,
          date,
          time,
          requestId,
          customer: { name: details.name.trim(), phone: details.phone.trim(), email: details.email.trim() || undefined },
          notes: details.notes.trim() || undefined,
        }),
      });
      if (!salon.onlinePaymentsConfigured) return goToManage(booking, false);
      setPending({ booking });
      await pay(booking);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Booking failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const retryPayment = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setError("");
    try {
      await pay(pending.booking);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const canNext =
    (step === 0 && Boolean(serviceId)) || (step === 1 && Boolean(employeeId)) || (step === 2 && Boolean(time)) || step === 3;
  const [{ minDate, maxDate }] = useState(() => ({
    minDate: dateKey(new Date()),
    maxDate: dateKey(new Date(Date.now() + 90 * 86_400_000)),
  }));

  if (pending) {
    return (
      <div className="panel">
        <h2>Complete your payment</h2>
        <p>Your appointment <b>{pending.booking.appointmentNumber}</b> is reserved. Finish paying to confirm it.</p>
        {error && <p role="alert" className="alert error">{error}</p>}
        <div className="actions">
          <button className="btn" disabled={busy} onClick={() => void retryPayment()}>{busy ? "Opening payment…" : "Pay now"}</button>
          <a className="btn ghost dark" href={`/manage/${pending.booking.id}?token=${encodeURIComponent(pending.booking.manageToken)}`}>View booking</a>
        </div>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={submit} noValidate={false}>
      <ol className="steps" aria-label="Booking progress">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "current" : index < step ? "done" : ""}>
            <span>{index < step ? "✓" : index + 1}</span> {label}
          </li>
        ))}
      </ol>

      {error && <p role="alert" className="alert error">{error}</p>}

      {step === 0 && (
        <div className="choices">
          {services.length === 0 && <p className="muted">This salon hasn&apos;t published any services yet.</p>}
          {services.map((item) => (
            <button type="button" key={item.id} className={`choice ${item.id === serviceId ? "selected" : ""}`} onClick={() => { setServiceId(item.id); setError(""); }}>
              <span><b>{item.name}</b><span className="muted small">{item.description || `${item.durationMinutes} min`}</span></span>
              <span className="price">{money(item.price, salon.currency)}<span className="muted small">{item.durationMinutes} min</span></span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="choices">
          {staffLoading && <p className="muted">Finding available specialists…</p>}
          {!staffLoading && staff.length === 0 && <p className="muted">No specialists are bookable for this service right now. Please pick another service or call the salon.</p>}
          {staff.map((item) => (
            <button type="button" key={item.id} className={`choice ${item.id === employeeId ? "selected" : ""}`} onClick={() => { setEmployeeId(item.id); setError(""); }}>
              <span><b>{item.name}</b><span className="muted small">{item.role}</span></span>
              <span aria-hidden>{item.id === employeeId ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <label className="field">Date
            <input type="date" value={date} min={minDate} max={maxDate} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <p className="muted small">Open {formatTime(salon.openingTime)} – {formatTime(salon.closingTime)}</p>
          {slotsLoading ? (
            <p className="muted">Checking availability…</p>
          ) : slots.length === 0 ? (
            <p className="muted">{slotNote || "No free slots on this day. Try another date."}</p>
          ) : (
            <div className="slots" role="radiogroup" aria-label="Available times">
              {slots.map((slot) => (
                <button type="button" key={slot} role="radio" aria-checked={slot === time} className={`slot ${slot === time ? "selected" : ""}`} onClick={() => setTime(slot)}>{formatTime(slot)}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="summary">
            <div><span className="muted small">Service</span><b>{service?.name}</b></div>
            <div><span className="muted small">Specialist</span><b>{employee?.name}</b></div>
            <div><span className="muted small">When</span><b>{new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {time && formatTime(time)}</b></div>
            <div><span className="muted small">Price</span><b>{service ? money(service.price, salon.currency) : ""}</b></div>
          </div>
          <label className="field">Full name<input required autoComplete="name" value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} /></label>
          <label className="field">Mobile number<input required type="tel" inputMode="tel" autoComplete="tel" minLength={8} placeholder="+91 98765 43210" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} /></label>
          <label className="field">Email <span className="muted small">(for your confirmation)</span><input type="email" autoComplete="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} /></label>
          <label className="field">Notes <span className="muted small">(optional)</span><textarea rows={2} value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} /></label>
          <p className="muted small">{salon.onlinePaymentsConfigured ? "You'll pay securely online to confirm your slot." : "No online payment needed — pay at the salon."}</p>
        </div>
      )}

      <div className="actions between">
        <button type="button" className="btn ghost dark" disabled={step === 0 || busy} onClick={() => { setStep(step - 1); setError(""); }}>Back</button>
        {step < 3 ? (
          <button type="button" className="btn" disabled={!canNext} onClick={() => { setStep(step + 1); setError(""); }}>Continue</button>
        ) : (
          <button type="submit" className="btn" disabled={busy || !details.name.trim() || details.phone.trim().length < 8}>
            {busy ? "Booking…" : salon.onlinePaymentsConfigured ? "Confirm & pay" : "Confirm booking"}
          </button>
        )}
      </div>
    </form>
  );
}
