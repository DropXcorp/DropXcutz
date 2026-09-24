"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center px-4 text-center">
      <div className="rounded-2xl bg-card p-8 shadow-sm ring-1 ring-border">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">This page hit a problem</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your data is safe. Try again, or go back to the dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground/80 transition hover:bg-muted"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
