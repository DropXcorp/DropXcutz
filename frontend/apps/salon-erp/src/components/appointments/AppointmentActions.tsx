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
  onDelete,
}: AppointmentActionsProps) {
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
        aria-label={`Actions for ${appointment.customer.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-xl p-2 transition hover:bg-slate-100"
      >
        <MoreVertical className="h-5 w-5 text-slate-600" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {appointment.customer.name}
            </p>

            <p className="text-xs text-slate-500">
              {appointment.appointment.appointmentNumber}
            </p>
          </div>

          {onView && <MenuItem icon={Eye} label="View Details" onClick={() => close(() => onView(appointment))} />}
          {onAssign && <MenuItem icon={UserCheck} label="Assign Stylist" onClick={() => close(() => onAssign(appointment))} />}
          {onEdit && <MenuItem icon={Pencil} label="Edit Appointment" onClick={() => close(() => onEdit(appointment))} />}
          {onCheckIn && <MenuItem icon={UserCheck} label="Check In" onClick={() => close(() => onCheckIn(appointment))} />}
          {onStart && <MenuItem icon={Play} label="Start Service" onClick={() => close(() => onStart(appointment))} />}
          {onComplete && <MenuItem icon={CheckCircle2} label="Complete Appointment" onClick={() => close(() => onComplete(appointment))} />}
          {(onPrint || onDuplicate) && <div className="my-1 border-t border-slate-100" />}
          {onPrint && <MenuItem icon={Printer} label="Print Invoice" onClick={() => close(() => onPrint(appointment))} />}
          {onDuplicate && <MenuItem icon={Copy} label="Duplicate" onClick={() => close(() => onDuplicate(appointment))} />}
          {(onCancel || onDelete) && <div className="my-1 border-t border-slate-100" />}
          {onCancel && <MenuItem icon={XCircle} label="Cancel Appointment" danger onClick={() => close(() => onCancel(appointment))} />}
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
            : "text-slate-700 hover:bg-slate-50"
        }`}
    >
      <Icon className="h-4 w-4" />

      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
