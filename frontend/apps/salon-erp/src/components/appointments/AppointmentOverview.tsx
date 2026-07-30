"use client";

import {
  CalendarCheck2,
  DoorOpen,
  Globe,
  IndianRupee,
} from "lucide-react";

import AppointmentKPICard from "@/src/components/appointments/AppointmentKPICard";

export interface AppointmentOverviewData {
  totalAppointments: number;
  totalTrend: string;

  walkInAppointments: number;
  walkInPercentage: string;

  onlineAppointments: number;
  onlinePercentage: string;

  averageRevenue: number;
  revenueTrend: string;
}

interface AppointmentOverviewProps {
  data: AppointmentOverviewData;
}

export default function AppointmentOverview({
  data,
}: AppointmentOverviewProps) {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <AppointmentKPICard
        title="Total Appointments"
        value={data.totalAppointments}
        subtitle="Today's bookings"
        icon={CalendarCheck2}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        trend="up"
        trendText={data.totalTrend}
      />

      <AppointmentKPICard
        title="Walk-in Appointments"
        value={data.walkInAppointments}
        subtitle="Walk-in share"
        icon={DoorOpen}
        iconBgColor="bg-orange-100"
        iconColor="text-orange-600"
        trend="neutral"
        trendText={data.walkInPercentage}
      />

      <AppointmentKPICard
        title="Online Appointments"
        value={data.onlineAppointments}
        subtitle="Online bookings"
        icon={Globe}
        iconBgColor="bg-violet-100"
        iconColor="text-violet-600"
        trend="neutral"
        trendText={data.onlinePercentage}
      />

      <AppointmentKPICard
        title="Avg Revenue / Appointment"
        value={`₹${data.averageRevenue}`}
        subtitle="Average revenue"
        icon={IndianRupee}
        iconBgColor="bg-emerald-100"
        iconColor="text-emerald-600"
        trend="up"
        trendText={data.revenueTrend}
      />
    </section>
  );
}