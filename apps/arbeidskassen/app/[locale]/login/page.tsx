"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildArbeidskassenHref, extractLocaleFromPathname, normalizeReturnTo } from "@arbeidskassen/ui";
import { createBrowserClient } from "@arbeidskassen/supabase/client";

export default function LoginPage() {
  const supabase = createBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawReturnTo = searchParams.get("returnTo");
  const locale = extractLocaleFromPathname(rawReturnTo ?? pathname);
  const visibleError = error || searchParams.get("error") || "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Feil e-post eller passord."
          : signInError.message,
      );
      setLoading(false);
      return;
    }

    const safeReturnTo = normalizeReturnTo(rawReturnTo, locale);
    router.replace(buildArbeidskassenHref(locale, "/select-tenant", { returnTo: safeReturnTo }));
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ak-bg-main)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ak-accent)] text-xl font-bold text-[var(--ak-accent-foreground)] shadow-md">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ak-text-main)]">
            Arbeidskassen
          </h1>
          <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
            Logg inn for å fortsette til arbeidsflaten din
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-semibold text-[var(--ak-text-dim)]"
            >
              E-post
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="navn@firma.no"
              className="w-full rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-2 text-[14px] text-[var(--ak-text-main)] outline-none transition-all placeholder:text-[var(--ak-text-muted)] focus:border-[var(--ak-accent)] focus:ring-2 focus:ring-[var(--ak-ring)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-semibold text-[var(--ak-text-dim)]"
            >
              Passord
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-2 text-[14px] text-[var(--ak-text-main)] outline-none transition-all placeholder:text-[var(--ak-text-muted)] focus:border-[var(--ak-accent)] focus:ring-2 focus:ring-[var(--ak-ring)]"
            />
          </div>

          {visibleError ? (
            <div className="rounded-lg border border-[var(--ak-status-stuck)] bg-[var(--ak-status-stuck-bg)] text-[var(--ak-status-stuck)]">
              {visibleError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--ak-accent)] py-2.5 text-[14px] font-bold text-[var(--ak-accent-foreground)] shadow-sm transition-colors hover:bg-[var(--ak-accent-hover)] disabled:opacity-60"
          >
            {loading ? "Logger inn..." : "Logg inn"}
          </button>
        </form>

        <div className="mt-4 text-center text-[13px] text-[var(--ak-text-muted)]">
          <p>Har du ikke tilgang ennå? Kontakt administratoren din.</p>
          <Link
            href="/"
            className="mt-2 inline-flex font-semibold text-[var(--ak-accent)] transition-colors hover:text-[var(--ak-accent-hover)]"
          >
            Tilbake til forsiden
          </Link>
        </div>
      </div>
    </div>
  );
}
