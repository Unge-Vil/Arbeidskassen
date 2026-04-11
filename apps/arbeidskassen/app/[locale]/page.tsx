import Link from "next/link";
import { redirect } from "next/navigation";
import { buildArbeidskassenHref } from "@arbeidskassen/ui";
import { getCurrentUser } from "@arbeidskassen/supabase";

export default async function HomePage({
  params,
}: {
  params?: Promise<{ locale: string }>;
}) {
  const [resolvedParams, user] = await Promise.all([
    Promise.resolve(params),
    getCurrentUser(),
  ]);
  const locale = resolvedParams?.locale ?? "no";

  if (user) {
    redirect(buildArbeidskassenHref(locale, "/dashboard"));
  }

  return (
    <main className="min-h-screen bg-[var(--ak-bg-main)] text-[var(--ak-text-main)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ak-accent)] text-sm font-bold text-[var(--ak-accent-foreground)] shadow-sm">
              A
            </div>
            <div>
              <p className="text-sm font-semibold">Arbeidskassen</p>
              <p className="text-xs text-[var(--ak-text-muted)]">En trygg inngang til arbeidsflaten</p>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-4 py-2 text-sm font-semibold text-[var(--ak-text-main)] shadow-sm transition-colors hover:border-[var(--ak-accent)] hover:text-[var(--ak-accent)]"
          >
            Logg inn
          </Link>
        </header>

        <section className="flex flex-1 items-center py-12">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <span className="inline-flex rounded-full bg-[var(--ak-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--ak-accent)]">
                Første versjon
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--ak-text-main)] md:text-5xl">
                En enkel inngang til Arbeidskassen
              </h1>
              <p className="mt-4 max-w-xl text-base text-[var(--ak-text-muted)] md:text-lg">
                Arbeidskassen samler arbeidsflater, oppgaver og oversikt på ett
                sted. Denne første versjonen gir teamet en ren og trygg vei inn i
                løsningen.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-lg bg-[var(--ak-accent)] px-5 py-3 text-sm font-bold text-[var(--ak-accent-foreground)] shadow-sm transition-colors hover:bg-[var(--ak-accent-hover)]"
                >
                  Logg inn for å fortsette
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-6 shadow-sm">
              <p className="text-sm font-semibold text-[var(--ak-text-main)]">I denne lanseringen</p>
              <ul className="mt-4 space-y-3 text-sm text-[var(--ak-text-muted)]">
                <li>• Offentlig førsteside uten krav om innlogging</li>
                <li>• Trygg innlogging til eksisterende arbeidsflate</li>
                <li>• Enkel og ryddig start for Vercel-deploy</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
