"use client";

import { Bell, Search } from "lucide-react";
import MobileSidebar from "@/src/components/layout/MobileSidebar";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <MobileSidebar />

        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Dashboard
          </h1>

          <p className="hidden text-sm text-zinc-500 md:block">
            Welcome back 👋
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search (Desktop only) */}
        <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 lg:flex">
          <Search size={18} className="text-zinc-500" />

          <input
            type="text"
            placeholder="Search..."
            className="w-48 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>

        {/* Notifications */}
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 transition hover:bg-zinc-100">
          <Bell size={18} />
        </button>

        {/* User Avatar */}
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition hover:bg-zinc-800">
          N
        </button>
      </div>
    </header>
  );
}