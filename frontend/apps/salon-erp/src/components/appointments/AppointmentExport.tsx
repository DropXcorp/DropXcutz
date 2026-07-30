"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
} from "lucide-react";

export type ExportType = "excel" | "csv" | "pdf" | "print";

interface AppointmentExportProps {
  onExport: (type: ExportType) => void;
}

export default function AppointmentExport({
  onExport,
}: AppointmentExportProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  const exportOptions = [
    {
      label: "Excel (.xlsx)",
      value: "excel",
      icon: FileSpreadsheet,
    },
    {
      label: "CSV",
      value: "csv",
      icon: FileSpreadsheet,
    },
    {
      label: "PDF",
      value: "pdf",
      icon: FileText,
    },
    {
      label: "Print",
      value: "print",
      icon: Printer,
    },
  ] as const;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <Download className="h-4 w-4" />

        Export

        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Export Appointments
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Choose a file format
            </p>
          </div>

          <div className="py-2">
            {exportOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onExport(option.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <Icon className="h-4 w-4 text-slate-600" />
                  </div>

                  <span className="text-sm font-medium text-slate-700">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}