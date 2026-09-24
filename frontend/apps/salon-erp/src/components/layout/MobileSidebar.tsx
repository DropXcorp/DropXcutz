"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import AppSidebar from "./AppSidebar";
import { useERPStore } from "@/src/lib/erp-store";
import Image from "next/image";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const salon = useERPStore((state) => state.currentSalon);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="rounded-xl p-2 transition hover:bg-muted/60 lg:hidden"
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 h-dvh w-80 max-w-[85vw] bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-transparent">
              <Image src="/logo.png" alt="DropXcutz logo" fill sizes="64px" className="object-cover" priority />
            </div>

            {/* Branding */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {salon?.name ?? "Salon"}
              </h2>

              <p className="text-sm text-muted-foreground">
                Manage Your Salon
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 transition hover:bg-muted/60"
          >
            <X size={28} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="h-[calc(100dvh-97px)] overflow-y-auto">
          <AppSidebar mobile onNavigate={() => setOpen(false)} />
        </div>
      </aside>
    </>
  );
}
