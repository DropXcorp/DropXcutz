"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type Trend = { date: string; newSalons: number; revenue: number };

const inr = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
const shortDate = (v: string) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  boxShadow: "0 8px 24px -12px rgb(15 23 42 / 0.25)",
  fontSize: 12,
};

export function TrendCharts({ trends }: { trends: Trend[] }) {
  const total = trends.reduce((sum, item) => sum + item.revenue, 0);
  const signups = trends.reduce((sum, item) => sum + item.newSalons, 0);
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card className="shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle>Revenue · last 14 days</CardTitle>
          <CardDescription>{inr(total)} in paid invoices</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => shortDate(String(l))} formatter={(v) => [inr(Number(v)), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="shadow-sm ring-1 ring-border">
        <CardHeader>
          <CardTitle>New salons · last 14 days</CardTitle>
          <CardDescription>{signups} signup{signups === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={28} />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} labelFormatter={(l) => shortDate(String(l))} formatter={(v) => [String(v), "New salons"]} />
              <Bar dataKey="newSalons" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export type DailyReport = { date: string; revenue: number; refunds: number };

export function DailyReportChart({ daily }: { daily: DailyReport[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={daily} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
          <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} labelFormatter={(l) => shortDate(String(l))} formatter={(v, n) => [inr(Number(v)), n === "revenue" ? "Revenue" : "Refunds"]} />
          <Bar dataKey="revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="refunds" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
