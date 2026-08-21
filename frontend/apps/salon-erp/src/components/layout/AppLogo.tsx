"use client";

import { useERPStore } from "@/src/lib/erp-store";
import Image from "next/image";

export default function AppLogo() {
  const salon = useERPStore((state) => state.currentSalon);
  const salonName = salon?.name ?? "Salon";

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-transparent">
        <Image src="/logo.png" alt="DropXcutz logo" fill sizes="44px" className="object-cover" priority />
      </div>
      <div>
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">
          {salonName}
        </h1>
        <p className="text-xs text-zinc-500">Manage Your Salon</p>
      </div>
    </div>
  );
}
