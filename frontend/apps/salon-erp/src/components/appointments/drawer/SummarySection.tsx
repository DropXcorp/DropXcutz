"use client";

import {
  CalendarDays,
  Clock3,
  Scissors,
  UserRound,
  BadgeCheck,
} from "lucide-react";

export default function SummarySection() {
  // Replace these with your global appointment state later
  const summary = {
    customer: "Rahul Sharma",
    date: "22 Jul 2026",
    time: "10:30 AM",
    duration: "60 mins",
    stylist: "John Mathew",
    services: 2,
    subtotal: 550,
    discount: 50,
    advance: 200,
    total: 500,
    balance: 300,
    status: "Booked",
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">

      {/* Header */}

      <div className="border-b border-zinc-200 px-5 py-4">

        <h3 className="text-lg font-semibold text-zinc-900">
          Appointment Summary
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Review all appointment details before saving.
        </p>

      </div>

      <div className="space-y-6 p-5">

        {/* Quick Overview */}

        <div className="grid gap-4 sm:grid-cols-2">

          <SummaryCard
            icon={CalendarDays}
            label="Date"
            value={summary.date}
          />

          <SummaryCard
            icon={Clock3}
            label="Time"
            value={`${summary.time} • ${summary.duration}`}
          />

          <SummaryCard
            icon={Scissors}
            label="Services"
            value={`${summary.services} Selected`}
          />

          <SummaryCard
            icon={UserRound}
            label="Stylist"
            value={summary.stylist}
          />

        </div>

        {/* Billing */}

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">

          <h4 className="mb-4 font-semibold text-zinc-900">
            Billing Summary
          </h4>

          <div className="space-y-3">

            <Row
              label="Subtotal"
              value={`₹${summary.subtotal}`}
            />

            <Row
              label="Discount"
              value={`₹${summary.discount}`}
            />

            <Row
              label="Advance Paid"
              value={`₹${summary.advance}`}
            />

            <div className="border-t border-zinc-200 pt-3">

              <Row
                label="Grand Total"
                value={`₹${summary.total}`}
                bold
              />

              <Row
                label="Remaining Balance"
                value={`₹${summary.balance}`}
                highlight
              />

            </div>

          </div>

        </div>

        {/* Status */}

        <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 p-4">

          <div className="flex items-center gap-3">

            <BadgeCheck className="h-6 w-6 text-green-600" />

            <div>

              <h4 className="font-semibold text-green-900">
                Appointment Ready
              </h4>

              <p className="text-sm text-green-700">
                All required information has been completed.
              </p>

            </div>

          </div>

          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            {summary.status}
          </span>

        </div>

      </div>

    </section>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">

      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white">

        <Icon className="h-5 w-5 text-zinc-700" />

      </div>

      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <h4 className="mt-1 font-semibold text-zinc-900">
        {value}
      </h4>

    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}

function Row({
  label,
  value,
  bold,
  highlight,
}: RowProps) {
  return (
    <div className="flex items-center justify-between">

      <span className="text-sm text-zinc-600">
        {label}
      </span>

      <span
        className={`${
          highlight
            ? "text-lg font-bold text-green-600"
            : bold
            ? "text-lg font-semibold text-zinc-900"
            : "font-medium text-zinc-800"
        }`}
      >
        {value}
      </span>

    </div>
  );
}
