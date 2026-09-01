"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";

type Salon = {
  name: string;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  openingTime: string;
  closingTime: string;
};
type Service = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  durationMinutes: number;
};
type Employee = { id: string; name: string; role: string };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const mode = process.env.NEXT_PUBLIC_SITE_MODE ?? "template";
const slug = process.env.NEXT_PUBLIC_SALON_SLUG ?? "dropx-studio";
const customKey = process.env.NEXT_PUBLIC_PUBLIC_KEY ?? "";
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base =
    mode === "custom"
      ? `${apiUrl}/v1/public`
      : `${apiUrl}/public/v1/salons/${slug}`;
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(mode === "custom" ? { "X-DropXcutz-Key": customKey } : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as {
    data?: T;
    error?: string;
  } | null;
  if (!response.ok)
    throw new Error(body?.error ?? "We could not complete that request.");
  return body?.data as T;
}

export default function PublicSite() {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Employee[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(tomorrow);
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const selectedService = useMemo(
    () => services.find((item) => item.id === serviceId),
    [services, serviceId],
  );
  useEffect(() => {
    Promise.all([request<Salon>(""), request<Service[]>("/services")])
      .then(([profile, catalog]) => {
        setSalon(profile);
        setServices(catalog);
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!serviceId) {
      setStaff([]);
      return;
    }
    request<Employee[]>(`/employees?serviceId=${encodeURIComponent(serviceId)}`)
      .then((items) => {
        setStaff(items);
        setEmployeeId("");
        setSlots([]);
        setTime("");
      })
      .catch((error: Error) => setMessage(error.message));
  }, [serviceId]);
  useEffect(() => {
    if (!serviceId || !employeeId || !date) return;
    request<{ slots: string[] }>(
      `/availability?serviceId=${encodeURIComponent(serviceId)}&employeeId=${encodeURIComponent(employeeId)}&date=${date}`,
    )
      .then((data) => {
        setSlots(data.slots);
        setTime("");
      })
      .catch((error: Error) => setMessage(error.message));
  }, [serviceId, employeeId, date]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!serviceId || !employeeId || !time) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBooking(true);
    setMessage("");
    try {
      const confirmation = await request<{ appointmentNumber: string }>(
        "/appointments",
        {
          method: "POST",
          body: JSON.stringify({
            serviceId,
            employeeId,
            date,
            time,
            requestId: crypto.randomUUID(),
            customer: {
              name: form.get("name"),
              phone: form.get("phone"),
              email: form.get("email") || undefined,
            },
            notes: form.get("notes") || undefined,
          }),
        },
      );
      setMessage(
        `Booked successfully. Your appointment number is ${confirmation.appointmentNumber}.`,
      );
      formElement.reset();
      setTime("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking failed.");
    } finally {
      setBooking(false);
    }
  };
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <span className="eyebrow">Online appointment booking</span>
          <h1>{salon?.name ?? (loading ? "Your salon" : "Salon unavailable")}</h1>
          <p>
            {salon
              ? `Choose your service, specialist, and a convenient time. ${salon.address ?? salon.city ?? ""}`
              : "Loading salon details…"}
          </p>
        </div>
      </section>
      <section className="section">
        <h2>Choose a service</h2>
        <p className="muted">Select the treatment you would like to book.</p>
        <div className="grid">
          {services.map((service) => (
            <article
              key={service.id}
              className={`card ${service.id === serviceId ? "selected" : ""}`}
            >
              <h3>{service.name}</h3>
              <p className="muted">
                {service.description ||
                  `${service.durationMinutes} minute appointment`}
              </p>
              <p className="price">
                ₹{service.price.toLocaleString("en-IN")} ·{" "}
                {service.durationMinutes} min
              </p>
              <button
                className={service.id === serviceId ? "primary" : ""}
                onClick={() => setServiceId(service.id)}
              >
                Select service
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <form className="booking" onSubmit={submit}>
          <h2>Book your visit</h2>
          {message && (
            <p
              className={`notice ${message.startsWith("Booked") ? "success" : ""}`}
            >
              {message}
            </p>
          )}
          <label className="field">
            Service
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Select a service</option>
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Specialist
            <select
              required
              value={employeeId}
              disabled={!serviceId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select a specialist</option>
              {staff.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.role}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Date
            <input
              required
              type="date"
              min={tomorrow()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className="field">
            <span>Available times</span>
            <div className="slots">
              {slots.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  className={`slot ${time === slot ? "selected" : ""}`}
                  onClick={() => setTime(slot)}
                >
                  {slot}
                </button>
              ))}
              {employeeId && !slots.length && (
                <span className="muted">No available times for this date.</span>
              )}
            </div>
          </div>
          <label className="field">
            Your name
            <input
              required
              name="name"
              maxLength={160}
              placeholder="Full name"
            />
          </label>
          <label className="field">
            Phone
            <input
              required
              name="phone"
              minLength={5}
              maxLength={30}
              placeholder="Phone number"
            />
          </label>
          <label className="field">
            Email (optional)
            <input name="email" type="email" placeholder="you@example.com" />
          </label>
          <label className="field">
            Notes (optional)
            <textarea
              name="notes"
              maxLength={1000}
              placeholder="Anything the salon should know?"
            />
          </label>
          <button
            disabled={booking || !time || !selectedService}
            className="primary"
            type="submit"
          >
            {booking
              ? "Booking…"
              : `Book ${selectedService?.name ?? "appointment"}`}
          </button>
        </form>
      </section>
      <footer className="footer">
        {salon?.phone && <span>{salon.phone} · </span>}
        {salon?.email && <span>{salon.email}</span>}
        <span> · Powered by DropXcutz</span>
      </footer>
    </main>
  );
}
