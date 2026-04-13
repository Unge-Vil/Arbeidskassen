/**
 * AuthenticatedShellSkeleton
 *
 * Shown as Suspense fallback while the authenticated layout awaits
 * getShellContext(). Approximates the visual structure of AuthenticatedShell
 * so the page feels stable during the initial load — no full-screen spinner.
 */
export function AuthenticatedShellSkeleton() {
  return (
    <div className="flex h-screen w-full select-none flex-col overflow-hidden bg-[var(--ak-bg-main)] font-sans text-[var(--ak-text-main)]">
      {/* Navbar skeleton — mirrors the top bar from AuthenticatedShell */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--ak-border)] px-4 py-3 sm:px-4 sm:py-4">
        {/* Workspace name pill */}
        <div className="h-5 w-28 animate-pulse rounded-full bg-[var(--ak-border)]" />
        <div className="flex-1" />
        {/* User avatar */}
        <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--ak-border)]" />
      </div>

      {/* Content area — centered spinner while data loads */}
      <main className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--ak-border)] border-t-[var(--ak-accent)]" />
          <p className="text-sm text-[var(--ak-text-muted)]">Laster…</p>
        </div>
      </main>
    </div>
  );
}
