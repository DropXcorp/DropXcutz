"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export default function SidebarItem({
  href,
  label,
  icon: Icon,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname();

  const active =
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
        active
          ? "bg-black text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
      }`}
    >
      <Icon size={20} />

      <span className="font-medium">{label}</span>
    </Link>
  );
}