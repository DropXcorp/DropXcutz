"use client";

import {
  Calendar,
  Clock3,
  IndianRupee,
  Scissors,
  User,
} from "lucide-react";
import Image from "next/image";

import AppointmentStatus from "./AppointmentStatus";
import AppointmentActions from "./AppointmentActions";
import { AppointmentTableItem } from "./AppointmentTable";

interface AppointmentCardProps {
  appointment: AppointmentTableItem;
  onClick?: (appointment: AppointmentTableItem) => void;
}

export default function AppointmentCard({
  appointment,
  onClick,
}: AppointmentCardProps) {
  return (
    <div
      onClick={() => onClick?.(appointment)}
      className="cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {appointment.customer.avatar ? (
            <Image
              src={appointment.customer.avatar}
              alt={appointment.customer.name}
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {appointment.customer.name.charAt(0)}
            </div>
          )}

          <div>
            <h3 className="font-semibold text-foreground">
              {appointment.customer.name}
            </h3>

            {appointment.customer.membership && (
              <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                {appointment.customer.membership}
              </span>
            )}
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <AppointmentActions appointment={appointment} />
        </div>
      </div>

      {/* Appointment Number */}
      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Appointment
          </p>

          <p className="font-semibold text-foreground">
            {appointment.appointment.appointmentNumber}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            appointment.appointment.source === "Online"
              ? "bg-violet-100 text-violet-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {appointment.appointment.source}
        </span>
      </div>

      {/* Services */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          <Scissors className="h-4 w-4" />
          <span className="text-sm font-medium">Services</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {appointment.services.map((service) => (
            <span
              key={service.id}
              className="rounded-lg bg-muted/60 px-3 py-1 text-xs font-medium text-foreground/80"
            >
              {service.name}
            </span>
          ))}
        </div>
      </div>

      {/* Stylist */}
      <div className="mt-6 flex items-center gap-3">
        <User className="h-4 w-4 text-muted-foreground" />

        <div>
          <p className="text-sm font-medium text-foreground">
            {appointment.stylist.name}
          </p>

          {appointment.stylist.designation && (
            <p className="text-xs text-muted-foreground">
              {appointment.stylist.designation}
            </p>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Date</span>
          </div>

          <p className="mt-2 text-sm font-semibold text-foreground">
            {appointment.schedule.date}
          </p>
        </div>

        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            <span className="text-xs">Time</span>
          </div>

          <p className="mt-2 text-sm font-semibold text-foreground">
            {appointment.schedule.time}
          </p>

          <p className="text-xs text-muted-foreground">
            {appointment.schedule.duration}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-muted/60 p-4">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-green-600" />

          <div>
            <p className="text-xs text-muted-foreground">Amount</p>

            <p className="font-semibold text-foreground">
              ₹{appointment.payment.amount}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            appointment.payment.status === "Paid"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {appointment.payment.status}
        </span>
        
      </div>
            {/* Footer */}
      <div className="mt-6 border-t border-border pt-5">

        <div className="flex items-center justify-between">

          <AppointmentStatus status={appointment.status} />

          <span className="text-xs text-muted-foreground">
            {appointment.payment.status === "Paid"
              ? "Payment Completed"
              : "Awaiting Payment"}
          </span>

        </div>

        {/* Quick Actions */}
        <div className="mt-5 grid grid-cols-3 gap-3">

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (appointment.customer.phone) {
                window.location.href = `tel:${appointment.customer.phone}`;
              }
            }}
            disabled={!appointment.customer.phone}
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted/60"
          >
            Call
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(appointment);
            }}
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted/60"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(appointment);
            }}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Details
          </button>

        </div>

      </div>
    </div>
  );
}

export function AppointmentCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5 shadow-sm">

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted" />

        <div className="flex-1">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="mt-2 h-3 w-24 rounded bg-muted/60" />
        </div>
      </div>

      <div className="mt-6 h-20 rounded-2xl bg-muted/60" />

      <div className="mt-4 h-20 rounded-2xl bg-muted/60" />

      <div className="mt-4 h-16 rounded-2xl bg-muted/60" />
    </div>
  );
}
