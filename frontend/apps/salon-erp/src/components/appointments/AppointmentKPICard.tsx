"use client";

import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";

interface AppointmentKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;

  iconBgColor?: string;
  iconColor?: string;

  trend?: "up" | "down" | "neutral";
  trendText?: string;

  className?: string;
}

export default function AppointmentKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = "bg-zinc-100",
  iconColor = "text-zinc-700",
  trend = "neutral",
  trendText,
  className,
}: AppointmentKPICardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-500">
            {title}
          </p>

          <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
            {value}
          </h2>
        </div>

        <div
          className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            iconBgColor
          )}
        >
          <Icon className={clsx("h-6 w-6", iconColor)} />
        </div>
      </div>

      {(trendText || subtitle) && (
        <div className="mt-5 flex items-center gap-2">
          {trend === "up" && (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          )}

          {trend === "down" && (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}

          {trendText && (
            <span
              className={clsx(
                "text-sm font-medium",
                trend === "up" && "text-emerald-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-zinc-500"
              )}
            >
              {trendText}
            </span>
          )}

          {subtitle && (
            <span className="text-sm text-zinc-500">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}