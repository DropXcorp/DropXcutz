"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DailyReportChart } from "@/components/trend-charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Request = <T>(url: string, init?: RequestInit) => Promise<T>;
type Report = { current: { metrics: Record<string, number>; daily: { date: string; revenue: number; refunds: number }[]; salons: { salonId: string; salonName: string; code: string; revenue: number; refunds: number }[] }; comparison: { metrics: Record<string, number> } | null };
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const iso = (date: Date) => date.toISOString().slice(0, 10);

export function ReportsConsole({ request }: { request: Request }) {
  const today = iso(new Date()); const firstDay = iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [from, setFrom] = useState(firstDay); const [to, setTo] = useState(today); const [compareFrom, setCompareFrom] = useState(""); const [compareTo, setCompareTo] = useState("");
  const [report, setReport] = useState<Report | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const query = new URLSearchParams({ from, to, ...(compareFrom ? { compareFrom } : {}), ...(compareTo ? { compareTo } : {}) }); setReport(await request<Report>(`/api/platform/reports/financial?${query}`)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load report."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const query = new URLSearchParams({ from, to, ...(compareFrom ? { compareFrom } : {}), ...(compareTo ? { compareTo } : {}) });
      void request<Report>(`/api/platform/reports/financial?${query}`).then(setReport).catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [from, to, compareFrom, compareTo]);
  useEffect(() => { if (!error) return; toast.error(error); setError(""); }, [error]);
  const csv = () => { window.location.assign(`/api/platform/reports/financial.csv?${new URLSearchParams({ from, to })}`); };
  const metrics = report?.current.metrics; const comparison = report?.comparison?.metrics;
  const delta = (key: string) => comparison ? (metrics?.[key] ?? 0) - (comparison[key] ?? 0) : null;
  const cards = metrics ? [["Revenue", "revenue"], ["GST collected", "gst"], ["Refunds", "refunds"], ["Expenses", "expenses"], ["Payouts", "payouts"], ["Profit / loss", "profitLoss"], ["Platform billing", "platformBillingRevenue"]] as const : [];
    return <section className="space-y-5 print:p-0"><form className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm print:hidden" onSubmit={(event) => { event.preventDefault(); void load(); }}><DateInput label="From" value={from} setValue={setFrom}/><DateInput label="To" value={to} setValue={setTo}/><DateInput label="Compare from" value={compareFrom} setValue={setCompareFrom}/><DateInput label="Compare to" value={compareTo} setValue={setCompareTo}/><Button type="submit" className="h-9">Apply</Button><Button type="button" variant="outline" className="h-9" onClick={csv}>CSV</Button><Button type="button" variant="outline" className="h-9" onClick={() => window.print()}>Print / Save PDF</Button></form><div className="hidden print:block"><h2 className="text-2xl font-bold">DropXCutz financial report</h2><p>{from} to {to}</p></div>{loading ? <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl"/>)}</div><Skeleton className="h-64 rounded-2xl"/></div> : metrics && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, key]) => <article key={key} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-2 text-2xl font-bold ${key === "profitLoss" && metrics[key] < 0 ? "text-rose-700" : "text-foreground"}`}>{money(metrics[key])}</p>{delta(key) !== null && <p className={`mt-2 text-xs font-semibold ${delta(key)! >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{delta(key)! >= 0 ? "+" : ""}{money(delta(key)!)} vs comparison</p>}</article>)}</div><div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]"><article className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-bold">Daily paid revenue</h2><div className="mt-4"><DailyReportChart daily={report.current.daily}/></div></article><article className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-bold">Tax & settlement summary</h2><dl className="mt-4 space-y-3 text-sm"><Row label="Paid salon invoices" value={String(metrics.paidInvoiceCount)}/><Row label="Refunded invoices" value={String(metrics.refundedInvoiceCount)}/><Row label="Platform billing invoices" value={String(metrics.platformBillingInvoiceCount)}/><Row label="Platform GST" value={money(metrics.platformBillingGst)}/></dl></article></div><article className="rounded-2xl border border-border bg-card shadow-sm"><div className="border-b p-5"><h2 className="font-bold">Salon revenue and refund breakdown</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="p-4">Salon</th><th className="p-4">Code</th><th className="p-4 text-right">Paid revenue</th><th className="p-4 text-right">Refunds</th></tr></thead><tbody>{report.current.salons.map((salon) => <tr key={salon.salonId} className="border-t"><td className="p-4 font-semibold">{salon.salonName}</td><td className="p-4 font-mono text-xs">{salon.code}</td><td className="p-4 text-right">{money(salon.revenue)}</td><td className="p-4 text-right">{money(salon.refunds)}</td></tr>)}</tbody></table></div></article></>}</section>;
}

function DateInput({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) { return <label className="text-sm font-semibold">{label}<Input type="date" value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 h-9 font-normal"/></label>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>; }
