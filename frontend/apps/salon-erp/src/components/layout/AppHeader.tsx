"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, LogOut, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MobileSidebar from "@/src/components/layout/MobileSidebar";
import { useERPStore } from "@/src/lib/erp-store";

export default function AppHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const refreshingRef = useRef(false);
  const router = useRouter();
  const user = useERPStore((state) => state.currentUser);
  const salon = useERPStore((state) => state.currentSalon);
  const notifications = useERPStore((state) => state.notifications);
  const refresh = useERPStore((state) => state.refresh);
  const markNotificationRead = useERPStore((state) => state.markNotificationRead);
  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";
  const unread = notifications.filter((item) => !item.readAt).length;
  const visibleNotifications = notifications.slice(0, 6);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible" || refreshingRef.current) return;
      refreshingRef.current = true;
      void refresh().finally(() => {
        refreshingRef.current = false;
      });
    };
    const interval = window.setInterval(refreshWhenVisible, 30000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const api = "/api";
    const stream = new EventSource(`${api}/erp/notifications/stream`, { withCredentials: true });
    stream.addEventListener("notification", () => void refresh());
    return () => stream.close();
  }, [refresh]);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
      if (!accountRef.current?.contains(target)) setAccountOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function openNotification(id: string) {
    await markNotificationRead(id);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) router.push(`/appointments?search=${encodeURIComponent(query)}`);
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/erp/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <div>
          <h1 className="text-xl font-semibold text-foreground">{salon?.name ?? "Salon ERP"}</h1>
          <p className="hidden text-sm text-muted-foreground md:block">{user ? `Welcome back, ${user.name}` : "Salon workspace"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <form onSubmit={submitSearch} className="hidden items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2 lg:flex">
          <Search size={18} className="text-muted-foreground" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} type="search" placeholder="Search appointments" aria-label="Search appointments" className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </form>
        <div ref={notificationsRef} className="relative">
          <button type="button" onClick={() => { setNotificationsOpen((open) => !open); void refresh(); }} aria-expanded={notificationsOpen} aria-controls="notifications-menu" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors hover:bg-muted/60">
            <Bell size={18} />
            {unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
          </button>
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div id="notifications-menu" role="dialog" aria-label="Notifications" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.16 }} className="absolute right-0 top-12 w-[min(90vw,380px)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="font-semibold text-foreground">Notifications</p><p className="text-xs text-muted-foreground">{unread ? `${unread} unread message${unread === 1 ? "" : "s"}` : "All caught up"}</p></div><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X className="h-4 w-4 text-muted-foreground" /></button></div>
                {visibleNotifications.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</p> : <div className="max-h-96 divide-y divide-border overflow-y-auto">{visibleNotifications.map((item) => <button type="button" key={item.id} onClick={() => void openNotification(item.id)} className={`block w-full px-4 py-3 text-left transition hover:bg-muted/60 ${item.readAt ? "bg-card" : "bg-muted/60"}`}><div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-muted" : "bg-primary"}`} /><div className="min-w-0"><p className="font-semibold text-foreground">{item.title}</p><p className="mt-1 text-sm leading-5 text-foreground/70">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString("en-IN")}</p></div></div></button>)}</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div ref={accountRef} className="relative">
          <button type="button" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-controls="account-menu" aria-label={`Signed in as ${user?.name ?? "user"}`} className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 pr-2 transition-colors hover:bg-muted/60">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-white">{initial}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {accountOpen && (
              <motion.div id="account-menu" role="dialog" aria-label="Account menu" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.16 }} className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl">
                <div className="border-b border-border px-3 py-2.5"><p className="truncate text-sm font-semibold text-foreground">{user?.name ?? "Salon user"}</p><p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p><p className="mt-1 truncate text-xs font-medium text-foreground/80">{salon?.name ?? "No salon assigned"}</p></div>
                <button type="button" onClick={() => void logout()} disabled={loggingOut} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"><LogOut className="h-4 w-4" />{loggingOut ? "Signing out…" : "Log out"}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

