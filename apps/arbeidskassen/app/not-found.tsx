import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ak-bg-main)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--ak-border)] bg-[var(--ak-bg-card)] p-8 text-center shadow-sm">
        <p className="text-5xl font-bold text-[var(--ak-text-muted)]">404</p>
        <h1 className="mt-2 text-xl font-semibold text-[var(--ak-text-main)]">
          Siden finnes ikke
        </h1>
        <p className="mt-2 text-sm text-[var(--ak-text-muted)]">
          Sjekk at adressen er riktig, eller gå tilbake til forsiden.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-block rounded-lg bg-[var(--ak-accent)] px-5 py-2 text-sm font-medium text-[var(--ak-accent-foreground)] transition-colors hover:bg-[var(--ak-accent-hover)]"
          >
            Gå til forsiden
          </Link>
        </div>
      </div>
    </div>
  );
}
