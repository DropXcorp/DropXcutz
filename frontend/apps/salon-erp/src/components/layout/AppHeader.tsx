"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, LogOut, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import MobileSidebar from "@/src/components/layout/MobileSidebar";
import { useERPStore } from "@/src/lib/erp-store";

export default function AppHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const user = useERPStore((state) => state.currentUser);
  const salon = useERPStore((state) => state.currentSalon);
  const notifications = useERPStore((state) => state.notifications);
  const refresh = useERPStore((state) => state.refresh);
  const markNotificationRead = useERPStore((state) => state.markNotificationRead);
  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";
  const unread = notifications.filter((item) => !item.readAt).length;
  const visibleNotifications = notifications.slice(0, 6);

  useEffect(() => {
    const interval = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  async function openNotification(id: string) {
    await markNotificationRead(id);
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"}/erp/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{salon?.name ?? "Salon ERP"}</h1>
          <p className="hidden text-sm text-zinc-500 md:block">{user ? `Welcome back, ${user.name}` : "Salon workspace"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 lg:flex">
          <Search size={18} className="text-zinc-500" />
          <input type="text" placeholder="Search..." className="w-48 bg-transparent text-sm outline-none placeholder:text-zinc-400" />
        </div>
        <div className="relative">
          <button type="button" onClick={() => { setNotificationsOpen((open) => !open); void refresh(); }} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 transition hover:bg-zinc-100">
            <Bell size={18} />
            {unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-zinc-950 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
          </button>
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} className="absolute right-0 top-12 w-[min(90vw,380px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3"><div><p className="font-semibold text-zinc-900">Notifications</p><p className="text-xs text-zinc-500">{unread ? `${unread} unread message${unread === 1 ? "" : "s"}` : "All caught up"}</p></div><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X className="h-4 w-4 text-zinc-500" /></button></div>
                {visibleNotifications.length === 0 ? <p className="p-6 text-center text-sm text-zinc-500">No notifications yet.</p> : <div className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">{visibleNotifications.map((item) => <button type="button" key={item.id} onClick={() => void openNotification(item.id)} className={`block w-full px-4 py-3 text-left transition hover:bg-zinc-50 ${item.readAt ? "bg-white" : "bg-zinc-50"}`}><div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-zinc-200" : "bg-zinc-950"}`} /><div className="min-w-0"><p className="font-semibold text-zinc-900">{item.title}</p><p className="mt-1 text-sm leading-5 text-zinc-600">{item.message}</p><p className="mt-1 text-xs text-zinc-400">{new Date(item.createdAt).toLocaleString("en-IN")}</p></div></div></button>)}</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-label={`Signed in as ${user?.name ?? "user"}`} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-1.5 pr-2 transition hover:bg-zinc-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-xs font-semibold text-white">{initial}</span>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </button>
          <AnimatePresence>
            {accountOpen && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                <div className="border-b border-zinc-100 px-3 py-2.5"><p className="truncate text-sm font-semibold text-zinc-900">{user?.name ?? "Salon user"}</p><p className="truncate text-xs text-zinc-500">{user?.email ?? ""}</p><p className="mt-1 truncate text-xs font-medium text-zinc-700">{salon?.name ?? "No salon assigned"}</p></div>
                <button type="button" onClick={() => void logout()} disabled={loggingOut} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"><LogOut className="h-4 w-4" />{loggingOut ? "Signing out…" : "Log out"}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

