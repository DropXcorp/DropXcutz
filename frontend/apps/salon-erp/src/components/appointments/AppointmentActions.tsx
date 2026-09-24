"use client";

import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Eye,
  Pencil,
  UserCheck,
  Play,
  CheckCircle2,
  Printer,
  Copy,
  XCircle,
  Ban,
  Trash2,
} from "lucide-react";

import { AppointmentTableItem } from "./AppointmentTable";

interface AppointmentActionsProps {
  appointment: AppointmentTableItem;

  onView?: (appointment: AppointmentTableItem) => void;
  onEdit?: (appointment: AppointmentTableItem) => void;
  onAssign?: (appointment: AppointmentTableItem) => void;
  onCheckIn?: (appointment: AppointmentTableItem) => void;
  onStart?: (appointment: AppointmentTableItem) => void;
  onComplete?: (appointment: AppointmentTableItem) => void;
  onPrint?: (appointment: AppointmentTableItem) => void;
  onDuplicate?: (appointment: AppointmentTableItem) => void;
  onCancel?: (appointment: AppointmentTableItem) => void;
  onNoShow?: (appointment: AppointmentTableItem) => void;
  busy?: boolean;
  onDelete?: (appointment: AppointmentTableItem) => void;
}

export default function AppointmentActions({
  appointment,
  onView,
  onEdit,
  onAssign,
  onCheckIn,
  onStart,
  onComplete,
  onPrint,
  onDuplicate,
  onCancel,
  onNoShow,
  busy = false,
  onDelete,
}: AppointmentActionsProps) {
  const status = appointment.status;
  const canCheckIn = status === "Booked" || status === "Confirmed";
  const canStart = status === "Checked In";
  const canComplete = status === "In Progress";
  const canCancel = status !== "Completed" && status !== "Cancelled" && status !== "No Show";
  const canNoShow = status === "Booked" || status === "Confirmed";
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function close(action?: () => void) {
    action?.();
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={busy}
        aria-label={`Actions for ${appointment.customer.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-xl p-2 transition hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
      >
        <MoreVertical className="h-5 w-5 text-foreground/70" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {appointment.customer.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {appointment.appointment.appointmentNumber}
            </p>
          </div>

          {onView && <MenuItem icon={Eye} label="View Details" onClick={() => close(() => onView(appointment))} />}
          {onAssign && <MenuItem icon={UserCheck} label="Assign Stylist" onClick={() => close(() => onAssign(appointment))} />}
          {onEdit && <MenuItem icon={Pencil} label="Edit Appointment" onClick={() => close(() => onEdit(appointment))} />}
          {onCheckIn && canCheckIn && <MenuItem icon={UserCheck} label="Check In" onClick={() => close(() => onCheckIn(appointment))} />}
          {onStart && canStart && <MenuItem icon={Play} label="Start Service" onClick={() => close(() => onStart(appointment))} />}
          {onComplete && canComplete && <MenuItem icon={CheckCircle2} label="Complete Appointment" onClick={() => close(() => onComplete(appointment))} />}
          {(onPrint || onDuplicate) && <div className="my-1 border-t border-border" />}
          {onPrint && <MenuItem icon={Printer} label="Print Invoice" onClick={() => close(() => onPrint(appointment))} />}
          {onDuplicate && <MenuItem icon={Copy} label="Duplicate" onClick={() => close(() => onDuplicate(appointment))} />}
          {((onCancel && canCancel) || (onNoShow && canNoShow) || onDelete) && <div className="my-1 border-t border-border" />}
          {onNoShow && canNoShow && <MenuItem icon={Ban} label="Mark as No Show" onClick={() => close(() => onNoShow(appointment))} />}
          {onCancel && canCancel && <MenuItem icon={XCircle} label="Cancel Appointment" danger onClick={() => close(() => onCancel(appointment))} />}
          {onDelete && <MenuItem icon={Trash2} label="Delete Appointment" danger onClick={() => close(() => onDelete(appointment))} />}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

function MenuItem({
  icon: Icon,
  label,
  danger,
  onClick,
}: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition
        ${
          danger
            ? "text-red-600 hover:bg-red-50"
            : "text-foreground/80 hover:bg-muted/60"
        }`}
    >
      <Icon className="h-4 w-4" />

      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
