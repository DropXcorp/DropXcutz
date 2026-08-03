"use client";

import { CalendarDays, Sun } from "lucide-react";

export default function DashboardHeader() {
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good Morning"
      : now.getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-yellow-500" />
          <h1 className="text-3xl font-bold text-zinc-900">{greeting} ðŸ‘‹</h1>
        </div>
        <p className="mt-2 text-zinc-500">
          Welcome back! Here&apos;s what&apos;s happening in your salon today.
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <CalendarDays className="h-5 w-5 text-zinc-500" />
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">Today</p>
          <p className="font-medium text-zinc-800">{formattedDate}</p>
        </div>
      </div>
    </div>
  );
}
