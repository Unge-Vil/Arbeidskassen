export default function DashboardLoading() {
  return (
    <div className="p-6">
      <div className="mb-6 h-7 w-48 animate-pulse rounded bg-[var(--ak-border)]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-[var(--ak-border)] bg-[var(--ak-bg-panel)]"
          />
        ))}
      </div>
    </div>
  );
}
