export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="h-24 animate-pulse rounded-2xl bg-muted/60" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-muted/60" />
    </div>
  );
}
