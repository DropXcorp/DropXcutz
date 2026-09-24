"use client";

import { Search, RotateCcw, Calendar, ChevronDown } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface AppointmentToolbarProps {
  search: string;
  employee: string;
  status: string;
  source: string;
  date: string;

  employees: FilterOption[];
  statuses: FilterOption[];
  sources: FilterOption[];
  dates: FilterOption[];

  onSearchChange: (value: string) => void;
  onEmployeeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onDateChange: (value: string) => void;

  onReset: () => void;
  exportAction: React.ReactNode;
}

export default function AppointmentToolbar({
  search,
  employee,
  status,
  source,
  date,

  employees,
  statuses,
  sources,
  dates,

  onSearchChange,
  onEmployeeChange,
  onStatusChange,
  onSourceChange,
  onDateChange,

  onReset,
  exportAction,
}: AppointmentToolbarProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

        <input
          type="search"
          aria-label="Search appointments"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search customer, phone or appointment ID..."
          className="h-11 w-full rounded-xl border border-border bg-muted/40 pl-12 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:bg-card"
        />
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">

        <Select
          value={employee}
          onChange={onEmployeeChange}
          options={employees}
        />

        <Select
          value={status}
          onChange={onStatusChange}
          options={statuses}
        />

        <Select
          value={source}
          onChange={onSourceChange}
          options={sources}
        />

        <Select
          value={date}
          onChange={onDateChange}
          options={dates}
          icon={<Calendar className="h-4 w-4" />}
        />

        <button
          onClick={onReset}
          className="ml-auto inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground/70 transition hover:bg-muted/60"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>

        {exportAction}

      </div>
    </div>
  );
}

interface SelectProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

function Select({
  value,
  options,
  onChange,
  icon,
}: SelectProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}

      <select
        aria-label={options[0]?.label ?? "Filter"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 appearance-none rounded-xl border border-border bg-card px-4 pr-10 text-sm font-medium outline-none transition hover:border-ring ${
          icon ? "pl-9" : ""
        }`}
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
