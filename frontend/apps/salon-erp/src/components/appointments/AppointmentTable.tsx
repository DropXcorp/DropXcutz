"use client";

import { CalendarCheck2 } from "lucide-react";
import Image from "next/image";

import AppointmentStatus from "@/src/components/appointments/AppointmentStatus";
import AppointmentActions from "@/src/components/appointments/AppointmentActions";

export interface AppointmentTableItem {
  id: string;

  customer: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
    membership?: string;
  };

  appointment: {
    appointmentNumber: string;
    source: "Walk-in" | "Online";
  };

  services: {
    id: string;
    name: string;
  }[];

  stylist: {
    id: string;
    name: string;
    avatar?: string;
    designation?: string;
  };

  schedule: {
    date: string;
    time: string;
    duration: string;
  };

  payment: {
    amount: number;
    status: "Paid" | "Pending" | "Partially Paid" | "Refunded";
  };

  status:
    | "Booked"
    | "Confirmed"
    | "Checked In"
    | "In Progress"
    | "Completed"
    | "Cancelled"
    | "No Show";
}

interface AppointmentTableProps {
  appointments: AppointmentTableItem[];
  loading?: boolean;
  busyId?: string | null;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onNoShow?: (appointment: AppointmentTableItem) => void;
  onRowClick?: (appointment: AppointmentTableItem) => void;
  onCreateAppointment?: () => void;
  onAssign?: (appointment: AppointmentTableItem) => void;
  onCheckIn?: (appointment: AppointmentTableItem) => void;
  onStart?: (appointment: AppointmentTableItem) => void;
  onComplete?: (appointment: AppointmentTableItem) => void;
  onCancel?: (appointment: AppointmentTableItem) => void;
}

const displayDate = (value: string) => {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
};

export default function AppointmentTable({
  appointments,
  loading = false,
  busyId = null,
  page = 1,
  pageSize = 0,
  total,
  onPageChange,
  onNoShow,
  onRowClick,
  onCreateAppointment,
  onAssign,
  onCheckIn,
  onStart,
  onComplete,
  onCancel,
}: AppointmentTableProps) {
  return (
    <div className="overflow-visible rounded-2xl border border-border bg-card shadow-sm">
      {/* Mobile / Tablet Responsive Layout */}
      <div className="p-4 xl:hidden">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <CalendarCheck2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No Appointments Found
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try changing your search criteria or create a new appointment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                onClick={() => onRowClick?.(appointment)}
                className="cursor-pointer space-y-3 rounded-2xl border border-border bg-card p-4 transition hover:border-border shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {appointment.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.appointment.appointmentNumber}
                      </p>
                    </div>
                  </div>
                  <AppointmentStatus status={appointment.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Stylist</p>
                    <p className="font-medium text-foreground/80">{appointment.stylist.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Schedule</p>
                    <p className="font-medium text-foreground/80">
                      {displayDate(appointment.schedule.date)} • {appointment.schedule.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <p className="font-semibold text-foreground">₹{appointment.payment.amount}</p>
                  <div onClick={(e) => e.stopPropagation()}>
                    <AppointmentActions appointment={appointment} busy={busyId === appointment.id} onNoShow={onNoShow} onEdit={onRowClick} onAssign={onAssign} onCheckIn={onCheckIn} onStart={onStart} onComplete={onComplete} onCancel={onCancel} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Responsive Table */}
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1100px] table-fixed">
          <thead className="sticky top-0 z-20 bg-muted/60">
            <tr className="border-b border-border">
              <TableHeading title="Customer" />
              <TableHeading title="Appointment" />
              <TableHeading title="Service" />
              <TableHeading title="Stylist" />
              <TableHeading title="Schedule" />
              <TableHeading title="Amount" />
              <TableHeading title="Status" />
              <th className="px-3 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading &&
              Array.from({ length: 8 }).map((_, index) => (
                <TableSkeleton key={index} />
              ))}

            {!loading && appointments.length === 0 && (
              <tr>
                <td colSpan={8} className="py-24">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                      <CalendarCheck2 className="h-10 w-10" />
                    </div>

                    <h3 className="mt-6 text-xl font-semibold text-foreground">
                      No Appointments Found
                    </h3>

                    <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                      No appointments match the selected filters. Try changing your search
                      criteria or create a new appointment.
                    </p>

                    {onCreateAppointment && (
                      <button
                        onClick={onCreateAppointment}
                        className="mt-8 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90"
                      >
                        + New Appointment
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              appointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  onClick={() => onRowClick?.(appointment)}
                  className={`cursor-pointer border-b border-border transition-all duration-200 hover:bg-muted/60 ${busyId === appointment.id ? "pointer-events-none opacity-60" : ""}`}
                >
                  {/* Customer */}
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      {appointment.customer.avatar ? (
                        <Image
                          src={appointment.customer.avatar}
                          alt={appointment.customer.name}
                          width={44}
                          height={44}
                          unoptimized
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                          {appointment.customer.name.charAt(0)}
                        </div>
                      )}

                      <div>
                        <h4 className="truncate font-semibold text-foreground">
                          {appointment.customer.name}
                        </h4>

                        {appointment.customer.membership && (
                          <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {appointment.customer.membership}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Appointment */}
                  <td className="px-3 py-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {appointment.appointment.appointmentNumber}
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          appointment.appointment.source === "Online"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {appointment.appointment.source}
                      </span>
                    </div>
                  </td>

                  {/* Services */}
                  <td className="px-3 py-4">
                    <div className="space-y-1">
                      {appointment.services.slice(0, 2).map((service) => (
                        <div
                          key={service.id}
                          className="rounded-lg bg-muted/60 px-2 py-1 text-xs font-medium text-foreground/80"
                        >
                          {service.name}
                        </div>
                      ))}

                      {appointment.services.length > 2 && (
                        <span className="text-xs font-medium text-foreground/70">
                          +{appointment.services.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stylist */}
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      {appointment.stylist.avatar ? (
                        <Image
                          src={appointment.stylist.avatar}
                          alt={appointment.stylist.name}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                          {appointment.stylist.name.charAt(0)}
                        </div>
                      )}

                      <div>
                        <p className="truncate font-medium text-foreground">
                          {appointment.stylist.name}
                        </p>

                        {appointment.stylist.designation && (
                          <p className="text-xs text-muted-foreground">
                            {appointment.stylist.designation}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Schedule */}
                  <td className="px-3 py-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {displayDate(appointment.schedule.date)}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {appointment.schedule.time}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {appointment.schedule.duration}
                      </p>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-3 py-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        ₹{appointment.payment.amount}
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          appointment.payment.status === "Paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {appointment.payment.status}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-4">
                    <AppointmentStatus status={appointment.status} />
                  </td>

                  {/* Actions */}
                  <td
                    className="px-3 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AppointmentActions appointment={appointment} busy={busyId === appointment.id} onNoShow={onNoShow} onEdit={onRowClick} onAssign={onAssign} onCheckIn={onCheckIn} onStart={onStart} onComplete={onComplete} onCancel={onCancel} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {(() => {
        const count = total ?? appointments.length;
        const size = pageSize || Math.max(count, 1);
        const pages = Math.max(1, Math.ceil(count / size));
        const from = count === 0 ? 0 : (page - 1) * size + 1;
        const to = Math.min(count, page * size);
        return (
          <div className="flex flex-col gap-3 border-t border-border bg-card px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{from}–{to}</span> of{" "}
              <span className="font-semibold text-foreground">{count}</span> appointments
            </div>
            {pages > 1 && onPageChange && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className="h-9 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => onPageChange(page + 1)}
                  className="h-9 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function TableHeading({ title }: { title: string }) {
  return (
    <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </th>
  );
}

function TableSkeleton() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 8 }).map((_, index) => (
        <td key={index} className="px-3 py-4">
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-2 h-3 w-16 rounded bg-muted/60" />
          </div>
        </td>
      ))}
    </tr>
  );
}
