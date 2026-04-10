"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@arbeidskassen/supabase/client";

export default function LoginPage() {
  const supabase = createBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
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

    router.replace("/select-tenant");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f5] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-md">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1f2e]">
            Arbeidskassen
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Logg inn for å fortsette til arbeidsflaten din
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-semibold text-gray-700"
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
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-[14px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#5B6CF9] focus:ring-2 focus:ring-[#5B6CF9]/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-semibold text-gray-700"
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
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-[14px] text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#5B6CF9] focus:ring-2 focus:ring-[#5B6CF9]/20"
            />
          </div>

          {visibleError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
              {visibleError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#5B6CF9] py-2.5 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#4b5cf0] disabled:opacity-60"
          >
            {loading ? "Logger inn..." : "Logg inn"}
          </button>
        </form>

        <div className="mt-4 text-center text-[13px] text-gray-500">
          <p>Har du ikke tilgang ennå? Kontakt administratoren din.</p>
          <Link
            href="/"
            className="mt-2 inline-flex font-semibold text-[#5B6CF9] transition-colors hover:text-[#4b5cf0]"
          >
            Tilbake til forsiden
          </Link>
        </div>
      </div>
    </div>
  );
}
