import { Button, Input, Label } from "@arbeidskassen/ui";
import {
  getCurrentUserProfile,
  getEffectiveRole,
  getTenantContext,
} from "@arbeidskassen/supabase";

import { updateProfileAction } from "../../../actions/profile";

function getQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

function formatRole(role: ReturnType<typeof getEffectiveRole>): string {
  switch (role) {
    case "owner":
      return "Eier";
    case "admin":
      return "Admin";
    case "member":
      return "Medlem";
    default:
      return "Lesetilgang";
  }
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "Ikke tilgjengelig";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Ikke tilgjengelig";
  }

  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, resolvedSearchParams, currentProfile, tenantContext] =
    await Promise.all([
      params,
      searchParams,
      getCurrentUserProfile(),
      getTenantContext(),
    ]);

  if (!currentProfile?.user || !tenantContext?.user) {
    return null;
  }

  const saved = getQueryValue(resolvedSearchParams.saved) === "1";
  const errorMessage = getQueryValue(resolvedSearchParams.error);
  const roleLabel = formatRole(getEffectiveRole(tenantContext));
  const tenantName = tenantContext.currentTenant?.display_name ?? tenantContext.currentTenant?.name;
  const profile = currentProfile.profile;

  return (
    <div className="h-full overflow-y-auto bg-[var(--ak-bg-main)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--ak-accent)]">Konto og personlige valg</p>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ak-text-main)]">
              Min profil
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--ak-text-muted)] sm:text-base">
              Her kan du oppdatere personinfo, språk, visning og varslingsvalg for kontoen din.
            </p>
          </div>
        </div>

        {saved ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            Profilen din ble lagret.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <form action={updateProfileAction} className="space-y-6">
            <input type="hidden" name="locale" value={locale} />

            <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Personinfo</h2>
                <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
                  Denne informasjonen vises på kontoen din og kan brukes i fremtidige moduler.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="displayName">Navn</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    defaultValue={profile.displayName}
                    placeholder="Skriv inn fullt navn"
                    maxLength={80}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    name="email"
                    value={currentProfile.user.email ?? ""}
                    readOnly
                    disabled
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={profile.phone}
                    placeholder="F.eks. +47 900 00 000"
                    maxLength={32}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="jobTitle">Stilling / rolle</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    defaultValue={profile.jobTitle}
                    placeholder="F.eks. prosjektleder"
                    maxLength={80}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Språk og tema</h2>
                <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
                  Velg hvordan arbeidsflaten skal føles for deg som bruker.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="preferredLocale">Foretrukket språk</Label>
                  <select
                    id="preferredLocale"
                    name="preferredLocale"
                    defaultValue={profile.preferredLocale}
                    className="flex h-10 w-full rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2 text-sm text-[var(--ak-text-main)] outline-none focus:ring-2 focus:ring-[var(--ak-accent)]"
                  >
                    <option value="no">Norsk Bokmål</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="themePreference">Tema</Label>
                  <select
                    id="themePreference"
                    name="themePreference"
                    defaultValue={profile.themePreference}
                    className="flex h-10 w-full rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2 text-sm text-[var(--ak-text-main)] outline-none focus:ring-2 focus:ring-[var(--ak-accent)]"
                  >
                    <option value="system">Systemstandard</option>
                    <option value="light">Lys</option>
                    <option value="dark">Mørk</option>
                    <option value="night">Natt</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Varsler</h2>
                <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
                  Bestem hvilke oppdateringer du vil få direkte i arbeidsdagen din.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 rounded-2xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-4 py-3">
                  <input
                    type="checkbox"
                    name="notifyEmail"
                    defaultChecked={profile.notificationPreferences.email}
                    className="mt-1 h-4 w-4 rounded border-[var(--ak-border-soft)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-[var(--ak-text-main)]">
                      E-postvarsler
                    </span>
                    <span className="block text-sm text-[var(--ak-text-muted)]">
                      Få viktige oppdateringer og påminnelser på e-post.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-4 py-3">
                  <input
                    type="checkbox"
                    name="notifyInApp"
                    defaultChecked={profile.notificationPreferences.inApp}
                    className="mt-1 h-4 w-4 rounded border-[var(--ak-border-soft)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-[var(--ak-text-main)]">
                      Varsler i appen
                    </span>
                    <span className="block text-sm text-[var(--ak-text-muted)]">
                      Vis hendelser og oppgaver direkte i grensesnittet.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-4 py-3">
                  <input
                    type="checkbox"
                    name="notifyWeeklySummary"
                    defaultChecked={profile.notificationPreferences.weeklySummary}
                    className="mt-1 h-4 w-4 rounded border-[var(--ak-border-soft)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-[var(--ak-text-main)]">
                      Ukesoppsummering
                    </span>
                    <span className="block text-sm text-[var(--ak-text-muted)]">
                      Motta en kort oppsummering av aktivitetene dine hver uke.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <div className="flex justify-end">
              <Button type="submit" className="min-w-36">
                Lagre endringer
              </Button>
            </div>
          </form>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Kontooversikt</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ak-text-muted)]">Aktiv workspace</dt>
                  <dd className="text-right font-medium text-[var(--ak-text-main)]">
                    {tenantName ?? "Ikke valgt"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ak-text-muted)]">Tilgangsnivå</dt>
                  <dd className="text-right font-medium text-[var(--ak-text-main)]">{roleLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ak-text-muted)]">Opprettet konto</dt>
                  <dd className="text-right font-medium text-[var(--ak-text-main)]">
                    {formatDate(currentProfile.user.created_at)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Sikkerhet</h2>
              <div className="mt-4 space-y-3 text-sm text-[var(--ak-text-muted)]">
                <p>
                  Sist innlogget: <span className="font-medium text-[var(--ak-text-main)]">{formatDate(currentProfile.user.last_sign_in_at)}</span>
                </p>
                <p>
                  Passord og mer avanserte sikkerhetsvalg kommer som egen utvidelse.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <Button type="button" variant="outline" className="w-full justify-start" disabled>
                  Endre passord (kommer snart)
                </Button>
                <Button type="button" variant="outline" className="w-full justify-start" disabled>
                  Tofaktorautentisering (kommer snart)
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
