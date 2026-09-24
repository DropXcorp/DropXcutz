"use client";

import { CalendarCheck2, Plus, RotateCw } from "lucide-react";

interface AppointmentHeaderProps {
  refreshing?: boolean;
  onRefresh?: () => void;
  onNewAppointment?: () => void;
}

export default function AppointmentHeader({
  refreshing = false,
  onRefresh,
  onNewAppointment,
}: AppointmentHeaderProps) {
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60"><CalendarCheck2 className="h-6 w-6 text-foreground/80" /></div>
        <div><h1 className="text-3xl font-bold text-foreground">Appointments</h1><p className="mt-1 text-sm text-muted-foreground">Manage today&apos;s bookings, walk-ins and online appointments.</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3"><CalendarCheck2 className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Today</p><p className="font-medium text-foreground/80">{formattedDate}</p></div></div>
        <button type="button" onClick={onRefresh} className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-4 font-medium text-foreground/80 transition hover:bg-muted/60"><RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
        <button type="button" onClick={onNewAppointment} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 font-medium text-white transition hover:bg-primary/90"><Plus className="h-4 w-4" />New Appointment</button>
      </div>
    </div>
  );
}
