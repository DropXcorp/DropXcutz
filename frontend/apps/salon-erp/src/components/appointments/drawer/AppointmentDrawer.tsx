"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  CalendarCheck2,
  Check,
  Clock,
  Percent,
  Phone,
  Plus,
  Save,
  Scissors,
  Search,
  User,
  X,
} from "lucide-react";

import { AppointmentTableItem } from "@/src/components/appointments/AppointmentTable";

interface AppointmentDrawerProps {
  open: boolean;
  mode?: "create" | "edit";
  appointment?: AppointmentTableItem | null;
  onClose: () => void;
  onSave: (data: AppointmentFormData) => Promise<void> | void;
  availableServices?: ServiceItem[];
  availableEmployees?: EmployeeItem[];
  availableCustomers?: CustomerItem[];
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface EmployeeItem {
  id: string;
  name: string;
  role?: string;
  active?: boolean;
}

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
}

export interface AppointmentFormData {
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  stylistId: string;
  services: ServiceItem[];
  applyDiscount: boolean;
  applyLoyaltyPoints: boolean;
  subtotal: number;
  discountAmount: number;
  loyaltyAmount: number;
  totalAmount: number;
}

const DEFAULT_SERVICES: ServiceItem[] = [];
const DEFAULT_EMPLOYEES: EmployeeItem[] = [];
const DEFAULT_CUSTOMERS: CustomerItem[] = [];
const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function AppointmentDrawer({
  open,
  mode = "create",
  appointment,
  onClose,
  onSave,
  availableServices = DEFAULT_SERVICES,
  availableEmployees = DEFAULT_EMPLOYEES,
  availableCustomers = DEFAULT_CUSTOMERS,
}: AppointmentDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <AppointmentForm
      key={`${mode}-${appointment?.id ?? "new"}`}
      mode={mode}
      appointment={appointment}
      onClose={onClose}
      onSave={onSave}
      availableServices={availableServices}
      availableEmployees={availableEmployees}
      availableCustomers={availableCustomers}
    />,
    document.body,
  );
}

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:opacity-60";
const labelClass = "mb-1.5 block text-xs font-semibold text-foreground/80";

function AppointmentForm({
  mode,
  appointment,
  onClose,
  onSave,
  availableServices = DEFAULT_SERVICES,
  availableEmployees = DEFAULT_EMPLOYEES,
  availableCustomers = DEFAULT_CUSTOMERS,
}: Omit<AppointmentDrawerProps, "open">) {
  const [saving, setSaving] = useState(false);
  const [pricingTouched, setPricingTouched] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [formData, setFormData] = useState<AppointmentFormData>(() => {
    const services =
      appointment?.services.map((service) => {
        const known = availableServices.find(
          (item) => item.id === service.id || item.name === service.name,
        );
        return known ?? { id: service.id, name: service.name, price: 0, durationMinutes: 30 };
      }) ?? [];
    return {
      customerName: appointment?.customer.name ?? "",
      customerPhone: appointment?.customer.phone ?? "",
      date: appointment ? toInputDate(appointment.schedule.date) : localToday(),
      time: appointment ? toInputTime(appointment.schedule.time) : "10:00",
      services,
      stylistId: appointment?.stylist.id ?? "unassigned",
      applyDiscount: false,
      applyLoyaltyPoints: false,
      subtotal: 0,
      discountAmount: 0,
      loyaltyAmount: 0,
      totalAmount: 0,
    };
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const subtotal = formData.services.reduce((sum, service) => sum + service.price, 0);
  const totalMinutes = formData.services.reduce((sum, service) => sum + service.durationMinutes, 0);
  const discountAmount = formData.applyDiscount ? Math.round(subtotal * 0.1) : 0;
  const loyaltyAmount = formData.applyLoyaltyPoints ? Math.round(subtotal * 0.1) : 0;
  const calculatedTotal = Math.max(0, subtotal - discountAmount - loyaltyAmount);
  const totalAmount = appointment && !pricingTouched ? appointment.payment.amount : calculatedTotal;

  const unavailableServices =
    availableServices.length > 0
      ? formData.services.filter((service) => !availableServices.some((item) => item.id === service.id))
      : [];

  const selectableServices = useMemo(() => {
    const query = serviceQuery.trim().toLowerCase();
    return availableServices.filter(
      (service) =>
        !formData.services.some((selected) => selected.id === service.id) &&
        (!query || service.name.toLowerCase().includes(query)),
    );
  }, [availableServices, formData.services, serviceQuery]);

  const endTime = useMemo(() => {
    const [h, m] = formData.time.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m) || totalMinutes === 0) return "";
    const end = h * 60 + m + totalMinutes;
    const hh = Math.floor(end / 60) % 24;
    const mm = end % 60;
    return new Date(2000, 0, 1, hh, mm).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }, [formData.time, totalMinutes]);

  const addService = (service: ServiceItem) => {
    setPricingTouched(true);
    setFormData((prev) => ({ ...prev, services: [...prev.services, service] }));
  };
  const removeService = (serviceId: string) => {
    setPricingTouched(true);
    setFormData((prev) => ({ ...prev, services: prev.services.filter((s) => s.id !== serviceId) }));
  };

  const setName = (customerName: string) => {
    const match = availableCustomers.find(
      (customer) => customer.name.toLowerCase() === customerName.trim().toLowerCase(),
    );
    setFormData((prev) => ({
      ...prev,
      customerName,
      customerPhone: match && !prev.customerPhone ? match.phone : prev.customerPhone,
    }));
  };
  const setPhone = (customerPhone: string) => {
    const digits = customerPhone.replace(/\s+/g, "");
    const match =
      digits.length >= 8
        ? availableCustomers.find((customer) => customer.phone.replace(/\s+/g, "") === digits)
        : undefined;
    setFormData((prev) => ({
      ...prev,
      customerPhone,
      customerName: match && !prev.customerName ? match.name : prev.customerName,
    }));
  };

  const canSubmit = formData.services.length > 0 && unavailableServices.length === 0 && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSave({ ...formData, subtotal, discountAmount, loyaltyAmount, totalAmount });
    } catch {
      // The caller reports the failure; keep the form open with the entered data.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100" role="presentation">
      <div
        className="erp-fade-in absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => !saving && onClose()}
      />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "create" ? "New appointment" : "Edit appointment"}
        className="erp-slide-in absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-card shadow-2xl ring-1 ring-border"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <CalendarCheck2 className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-foreground">
                {mode === "create" ? "New appointment" : "Edit appointment"}
              </h2>
              <p className="truncate text-xs text-muted-foreground">
                {mode === "edit" && appointment?.appointment.appointmentNumber
                  ? appointment.appointment.appointmentNumber
                  : "Book a walk-in or phone appointment"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-6">
          {/* Customer */}
          <section className="space-y-3">
            <SectionTitle icon={User} title="Client" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="apt-name">Full name *</label>
                <input
                  id="apt-name"
                  required
                  list="apt-customers"
                  autoComplete="off"
                  placeholder="e.g. Priya Sharma"
                  value={formData.customerName}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                />
                <datalist id="apt-customers">
                  {availableCustomers.slice(0, 200).map((customer) => (
                    <option key={customer.id} value={customer.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelClass} htmlFor="apt-phone">Phone *</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
                  <input
                    id="apt-phone"
                    required
                    type="tel"
                    inputMode="tel"
                    minLength={5}
                    placeholder="+91 98765 43210"
                    value={formData.customerPhone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${fieldClass} pl-9`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="space-y-3">
            <SectionTitle icon={Scissors} title="Services" hint="Select at least one" />
            {formData.services.length > 0 && (
              <ul className="space-y-2">
                {formData.services.map((service) => {
                  const missing = unavailableServices.some((item) => item.id === service.id);
                  return (
                    <li
                      key={service.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                        missing ? "border-red-200 bg-red-50" : "border-border bg-muted/40"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {missing ? "No longer offered — remove to continue" : `${service.durationMinutes} mins`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums text-foreground">{money(service.price)}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${service.name}`}
                          onClick={() => removeService(service.id)}
                          className="rounded-md p-1 text-muted-foreground transition hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="rounded-xl border border-dashed border-border p-3">
              {availableServices.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  No services in your catalogue yet. Add services first from the Services page.
                </p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                    <input
                      type="search"
                      value={serviceQuery}
                      onChange={(e) => setServiceQuery(e.target.value)}
                      placeholder="Search services to add…"
                      aria-label="Search services"
                      className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
                    />
                  </div>
                  <div className="mt-3 grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2">
                    {selectableServices.length === 0 ? (
                      <p className="col-span-full py-3 text-center text-xs text-muted-foreground">
                        {serviceQuery ? "No matching services." : "All services added."}
                      </p>
                    ) : (
                      selectableServices.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => addService(service)}
                          className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">{service.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {money(service.price)} · {service.durationMinutes}m
                            </span>
                          </span>
                          <Plus className="size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Schedule */}
          <section className="space-y-3">
            <SectionTitle icon={Clock} title="Schedule & stylist" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="apt-date">Date *</label>
                <input
                  id="apt-date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="apt-time">Time *</label>
                <input
                  id="apt-time"
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
            {totalMinutes > 0 && (
              <p className="text-xs text-muted-foreground">
                Duration {totalMinutes} mins{endTime ? ` · ends around ${endTime}` : ""}
              </p>
            )}
            <div>
              <label className={labelClass} htmlFor="apt-stylist">Stylist</label>
              <select
                id="apt-stylist"
                value={formData.stylistId}
                onChange={(e) => setFormData({ ...formData, stylistId: e.target.value })}
                className={fieldClass}
              >
                <option value="unassigned">Unassigned</option>
                {availableEmployees
                  .filter((employee) => employee.active !== false)
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                      {employee.role ? ` — ${employee.role}` : ""}
                    </option>
                  ))}
              </select>
            </div>
          </section>

          {/* Pricing */}
          <section className="space-y-3">
            <SectionTitle icon={Percent} title="Pricing" />
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleRow
                icon={Percent}
                iconClass="text-emerald-600"
                label="10% discount"
                checked={formData.applyDiscount}
                onChange={(checked) => {
                  setPricingTouched(true);
                  setFormData({ ...formData, applyDiscount: checked });
                }}
              />
              <ToggleRow
                icon={Award}
                iconClass="text-amber-500"
                label="10% loyalty points"
                checked={formData.applyLoyaltyPoints}
                onChange={(checked) => {
                  setPricingTouched(true);
                  setFormData({ ...formData, applyLoyaltyPoints: checked });
                }}
              />
            </div>
            <dl className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              {formData.applyDiscount && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount (10%)</dt>
                  <dd className="tabular-nums">−{money(discountAmount)}</dd>
                </div>
              )}
              {formData.applyLoyaltyPoints && (
                <div className="flex justify-between text-amber-700">
                  <dt>Loyalty points (10%)</dt>
                  <dd className="tabular-nums">−{money(loyaltyAmount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-border pt-2">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="text-xl font-semibold tabular-nums text-foreground">{money(totalAmount)}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t bg-card px-5 py-4 sm:px-6">
          <div className="hidden min-w-0 sm:block">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{money(totalAmount)}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground/80 transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              ) : mode === "create" ? (
                <Check className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
              {saving ? "Saving…" : mode === "create" ? "Book appointment" : "Save changes"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b pb-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </h3>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  iconClass,
  label,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 transition hover:bg-muted/40">
      <span className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
        <Icon className={`size-4 ${iconClass}`} />
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border accent-primary"
      />
    </label>
  );
}

function toInputDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? localToday()
    : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function toInputTime(value: string) {
  const parsed = new Date(`2000-01-01 ${value}`);
  return Number.isNaN(parsed.getTime()) ? "10:00" : parsed.toTimeString().slice(0, 5);
}
