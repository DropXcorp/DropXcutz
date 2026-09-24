"use client";

import { CalendarDays, Clock3, Timer, Store, Globe } from "lucide-react";
import { useState } from "react";

export default function AppointmentDetails() {
  const [bookingSource, setBookingSource] = useState<
    "Walk-in" | "Online"
  >("Walk-in");

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">

      {/* Header */}

      <div className="border-b border-border px-5 py-4">
        <h3 className="text-lg font-semibold text-foreground">
          Appointment Details
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Select the appointment schedule and booking source.
        </p>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">

        {/* Date */}

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/80">
            Appointment Date
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3 transition focus-within:border-black">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />

            <input
              type="date"
              className="w-full border-0 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Time */}

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/80">
            Appointment Time
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3 transition focus-within:border-black">
            <Clock3 className="h-5 w-5 text-muted-foreground" />

            <input
              type="time"
              className="w-full border-0 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Duration */}

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/80">
            Duration
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3">

            <Timer className="h-5 w-5 text-muted-foreground" />

            <select className="w-full border-0 bg-transparent outline-none">

              <option>15 Minutes</option>
              <option>30 Minutes</option>
              <option>45 Minutes</option>
              <option>60 Minutes</option>
              <option>90 Minutes</option>
              <option>120 Minutes</option>

            </select>

          </div>
        </div>

        {/* Status */}

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/80">
            Status
          </label>

          <select className="h-12 w-full rounded-xl border border-border bg-muted/60 px-4 outline-none transition focus:border-black">

            <option>Booked</option>
            <option>Confirmed</option>
            <option>Checked In</option>
            <option>In Progress</option>

          </select>
        </div>

      </div>

      {/* Booking Source */}

      <div className="border-t border-border p-5">

        <label className="mb-4 block text-sm font-medium text-foreground/80">
          Booking Source
        </label>

        <div className="grid gap-4 md:grid-cols-2">

          {/* Walk-in */}

          <button
            type="button"
            onClick={() => setBookingSource("Walk-in")}
            className={`rounded-2xl border p-5 text-left transition ${
              bookingSource === "Walk-in"
                ? "border-black bg-muted/60"
                : "border-border hover:bg-muted/60"
            }`}
          >
            <Store className="h-7 w-7 text-foreground/80" />

            <h4 className="mt-4 font-semibold text-foreground">
              Walk-in
            </h4>

            <p className="mt-1 text-sm text-muted-foreground">
              Customer visited the salon directly.
            </p>
          </button>

          {/* Online */}

          <button
            type="button"
            onClick={() => setBookingSource("Online")}
            className={`rounded-2xl border p-5 text-left transition ${
              bookingSource === "Online"
                ? "border-black bg-muted/60"
                : "border-border hover:bg-muted/60"
            }`}
          >
            <Globe className="h-7 w-7 text-foreground/80" />

            <h4 className="mt-4 font-semibold text-foreground">
              Online Booking
            </h4>

            <p className="mt-1 text-sm text-muted-foreground">
              Appointment booked through website or app.
            </p>
          </button>

        </div>

      </div>

    </section>
  );
}