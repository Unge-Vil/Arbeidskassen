import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@arbeidskassen/supabase";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f4f5f5] text-[#1a1f2e]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B6CF9] text-sm font-bold text-white shadow-sm">
              A
            </div>
            <div>
              <p className="text-sm font-semibold">Arbeidskassen</p>
              <p className="text-xs text-gray-500">En trygg inngang til arbeidsflaten</p>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1a1f2e] shadow-sm transition-colors hover:border-[#5B6CF9] hover:text-[#5B6CF9]"
          >
            Logg inn
          </Link>
        </header>

        <section className="flex flex-1 items-center py-12">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <span className="inline-flex rounded-full bg-[#5B6CF9]/10 px-3 py-1 text-xs font-semibold text-[#5B6CF9]">
                Første versjon
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#1a1f2e] md:text-5xl">
                En enkel inngang til Arbeidskassen
              </h1>
              <p className="mt-4 max-w-xl text-base text-gray-600 md:text-lg">
                Arbeidskassen samler arbeidsflater, oppgaver og oversikt på ett
                sted. Denne første versjonen gir teamet en ren og trygg vei inn i
                løsningen.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-lg bg-[#5B6CF9] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#4b5cf0]"
                >
                  Logg inn for å fortsette
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#1a1f2e]">I denne lanseringen</p>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
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
