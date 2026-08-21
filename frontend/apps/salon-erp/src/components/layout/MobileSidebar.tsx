"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import { useERPStore } from "@/src/lib/erp-store";
import Image from "next/image";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const salon = useERPStore((state) => state.currentSalon);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl p-2 transition hover:bg-zinc-100 lg:hidden"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-80 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-transparent">
              <Image src="/logo.png" alt="DropXcutz logo" fill sizes="64px" className="object-cover" priority />
            </div>

            {/* Branding */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">
                {salon?.name ?? "Salon"}
              </h2>

              <p className="text-sm text-zinc-500">
                Manage Your Salon
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 transition hover:bg-zinc-100"
          >
            <X size={28} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="h-[calc(100vh-97px)] overflow-y-auto">
          <AppSidebar mobile />
        </div>
      </aside>
    </>
  );
}
