"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck2,
  Save,
  X,
  User,
  Phone,
  Scissors,
  Trash2,
  Percent,
  Award,
} from "lucide-react";

import { AppointmentTableItem } from "@/src/components/appointments/AppointmentTable";

interface AppointmentDrawerProps {
  open: boolean;
  mode?: "create" | "edit";
  appointment?: AppointmentTableItem | null;
  onClose: () => void;
  onSave: (data: AppointmentFormData) => void;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface AppointmentFormData {
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  services: ServiceItem[];
  applyDiscount: boolean;
  applyLoyaltyPoints: boolean;
  subtotal: number;
  discountAmount: number;
  loyaltyAmount: number;
  totalAmount: number;
}

const AVAILABLE_SERVICES: ServiceItem[] = [
  { id: "s1", name: "Haircut & Styling", price: 600, durationMinutes: 45 },
  { id: "s2", name: "Hair Coloring", price: 2500, durationMinutes: 90 },
  { id: "s3", name: "Beard Trim", price: 300, durationMinutes: 20 },
  { id: "s4", name: "Facial Treatment", price: 1500, durationMinutes: 60 },
  { id: "s5", name: "Head Massage", price: 500, durationMinutes: 30 },
];

export default function AppointmentDrawer({
  open,
  mode = "create",
  appointment,
  onClose,
  onSave,
}: AppointmentDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <AppointmentForm
      key={`${mode}-${appointment?.id ?? "new"}`}
      mode={mode}
      appointment={appointment}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function AppointmentForm({
  mode,
  appointment,
  onClose,
  onSave,
}: Omit<AppointmentDrawerProps, "open">) {
  const [formData, setFormData] = useState<AppointmentFormData>(() => {
    const services = appointment?.services.map((service) => {
      const knownService = AVAILABLE_SERVICES.find((item) => item.name === service.name);
      return knownService ?? { id: service.id, name: service.name, price: 500, durationMinutes: 30 };
    }) ?? [];

    return {
    customerName: "",
    customerPhone: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    services: [],
    applyDiscount: false,
    applyLoyaltyPoints: false,
    subtotal: 0,
    discountAmount: 0,
    loyaltyAmount: 0,
      totalAmount: 0,
      ...(appointment
        ? {
            customerName: appointment.customer.name,
            date: toInputDate(appointment.schedule.date),
            time: toInputTime(appointment.schedule.time),
            services,
          }
        : {}),
    };
  });

  const subtotal = formData.services.reduce((sum, service) => sum + service.price, 0);
  const discountAmount = formData.applyDiscount ? Math.round(subtotal * 0.1) : 0;
  const loyaltyAmount = formData.applyLoyaltyPoints ? Math.round(subtotal * 0.1) : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount - loyaltyAmount);

  const handleAddService = (serviceId: string) => {
    const serviceToAdd = AVAILABLE_SERVICES.find((s) => s.id === serviceId);
    if (serviceToAdd && !formData.services.some((s) => s.id === serviceId)) {
      setFormData((prev) => ({
        ...prev,
        services: [...prev.services, serviceToAdd],
      }));
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== serviceId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, subtotal, discountAmount, loyaltyAmount, totalAmount });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container with Fixed Max Height */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
        <form
          onSubmit={handleSubmit}
          className="flex h-[90vh] max-h-[700px] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">
                {mode === "create" ? "New Appointment" : "Edit Appointment"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Customer Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Client Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.customerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, customerPhone: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Services Selection Section */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  <Scissors className="h-4 w-4 text-zinc-500" /> Services *
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddService(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 outline-none hover:bg-zinc-100"
                >
                  <option value="">+ Add Service</option>
                  {AVAILABLE_SERVICES.filter(
                    (s) => !formData.services.some((selected) => selected.id === s.id)
                  ).map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} (₹{service.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scrollable Service List Container */}
              <div className="max-h-48 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
                {formData.services.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-400">
                    No services selected. Please select at least one.
                  </p>
                ) : (
                  formData.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 text-sm shadow-sm"
                    >
                      <span className="font-medium text-zinc-800">{service.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-zinc-900">₹{service.price}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(service.id)}
                          className="text-zinc-400 transition hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Schedule (Date & Time) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            {/* Discounts & Loyalty Points */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition hover:bg-zinc-100">
                <div className="flex items-center gap-2.5">
                  <Percent className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-zinc-800">10% Discount</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.applyDiscount}
                  onChange={(e) =>
                    setFormData({ ...formData, applyDiscount: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition hover:bg-zinc-100">
                <div className="flex items-center gap-2.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-zinc-800">10% Loyalty Points</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.applyLoyaltyPoints}
                  onChange={(e) =>
                    setFormData({ ...formData, applyLoyaltyPoints: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
              </label>
            </div>

            {/* Total Amount & Price Breakdown */}
            <div className="rounded-2xl bg-zinc-900 p-4 text-white space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Subtotal</span>
                <span className="font-medium text-zinc-200">₹{subtotal}</span>
              </div>

              {formData.applyDiscount && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>Discount (10%)</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              {formData.applyLoyaltyPoints && (
                <div className="flex justify-between text-xs text-amber-400">
                  <span>Loyalty Points (10%)</span>
                  <span>-₹{loyaltyAmount}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-sm font-medium">
                <span className="text-zinc-300">Final Amount</span>
                <span className="text-2xl font-bold text-white">₹{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={formData.services.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {mode === "create" ? "Create Appointment" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function toInputDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString().split("T")[0] : parsed.toISOString().split("T")[0];
}

function toInputTime(value: string) {
  const parsed = new Date(`2000-01-01 ${value}`);
  return Number.isNaN(parsed.getTime()) ? "10:00" : parsed.toTimeString().slice(0, 5);
}
