export default function AuthenticatedLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ak-border)] border-t-[var(--ak-accent)]" />
        <p className="text-sm text-[var(--ak-text-muted)]">Laster…</p>
      </div>
    </div>
  );
}
