"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
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
      label: "Excel (.csv)",
      value: "excel",
      icon: FileSpreadsheet,
    },
    {
      label: "CSV",
      value: "csv",
      icon: FileSpreadsheet,
    },
    {
      label: "Print / Save as PDF",
      value: "pdf",
      icon: FileText,
    },
  ] as const;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground/80 transition hover:bg-muted/60"
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
        <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">
              Export Appointments
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Choose a file format
            </p>
          </div>

          <div className="py-2">
            {exportOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onExport(option.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-muted/60"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">
                    <Icon className="h-4 w-4 text-foreground/70" />
                  </div>

                  <span className="text-sm font-medium text-foreground/80">
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