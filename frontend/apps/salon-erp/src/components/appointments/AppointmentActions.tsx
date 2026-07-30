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

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  function close(action?: () => void) {
    action?.();
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-xl p-2 transition hover:bg-slate-100"
      >
        <MoreVertical className="h-5 w-5 text-slate-600" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {appointment.customer.name}
            </p>

            <p className="text-xs text-slate-500">
              {appointment.appointment.appointmentNumber}
            </p>
          </div>

          <MenuItem
            icon={Eye}
            label="View Details"
            onClick={() => close(() => onView?.(appointment))}
          />

          <MenuItem
            icon={Pencil}
            label="Edit Appointment"
            onClick={() => close(() => onEdit?.(appointment))}
          />

          <MenuItem
            icon={UserCheck}
            label="Check In"
            onClick={() => close(() => onCheckIn?.(appointment))}
          />

          <MenuItem
            icon={Play}
            label="Start Service"
            onClick={() => close(() => onStart?.(appointment))}
          />

          <MenuItem
            icon={CheckCircle2}
            label="Complete Appointment"
            onClick={() => close(() => onComplete?.(appointment))}
          />

          <div className="my-1 border-t border-slate-100" />

          <MenuItem
            icon={Printer}
            label="Print Invoice"
            onClick={() => close(() => onPrint?.(appointment))}
          />

          <MenuItem
            icon={Copy}
            label="Duplicate"
            onClick={() => close(() => onDuplicate?.(appointment))}
          />

          <div className="my-1 border-t border-slate-100" />

          <MenuItem
            icon={XCircle}
            label="Cancel Appointment"
            danger
            onClick={() => close(() => onCancel?.(appointment))}
          />

          <MenuItem
            icon={Trash2}
            label="Delete Appointment"
            danger
            onClick={() => close(() => onDelete?.(appointment))}
          />
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
      onClick={onClick}
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