"use client";

import { CheckCircle2, Clock3, Loader2, UserCheck, XCircle, Ban } from "lucide-react";
import clsx from "clsx";

export type AppointmentStatusType =
  | "Booked"
  | "Confirmed"
  | "Checked In"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "No Show";

interface AppointmentStatusProps {
  status: AppointmentStatusType;
}

const statusConfig: Record<
  AppointmentStatusType,
  {
    label: string;
    icon: React.ElementType;
    className: string;
  }
> = {
  Booked: {
    label: "Booked",
    icon: Clock3,
    className: "bg-blue-100 text-blue-700",
  },
  Confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700",
  },
  "Checked In": {
    label: "Checked In",
    icon: UserCheck,
    className: "bg-cyan-100 text-cyan-700",
  },
  "In Progress": {
    label: "In Progress",
    icon: Loader2,
    className: "bg-yellow-100 text-yellow-700",
  },
  Completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700",
  },
  Cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-100 text-red-700",
  },
  "No Show": {
    label: "No Show",
    icon: Ban,
    className: "bg-gray-200 text-gray-700",
  },
};

export default function AppointmentStatus({
  status,
}: AppointmentStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        config.className
      )}
    >
      <Icon
        className={clsx(
          "h-4 w-4",
          status === "In Progress" && "animate-spin"
        )}
      />

      {config.label}
    </span>
  );
}