import { Button, Input, Label, SelectNative } from "@arbeidskassen/ui";
import {
  getCurrentUserProfile,
  getEffectiveRole,
  getTenantContext,
} from "@arbeidskassen/supabase";

import { updateProfileAction } from "../../actions/profile";
import { getLocale } from "next-intl/server";

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

type PreferenceRowProps = {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
};

function PreferenceRow({ name, title, description, defaultChecked }: PreferenceRowProps) {
  return (
    <label className="flex items-start gap-3 rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-[var(--ak-border-soft)]"
      />
      <span>
        <span className="block text-sm font-medium text-[var(--ak-text-main)]">{title}</span>
        <span className="block text-sm text-[var(--ak-text-muted)]">{description}</span>
      </span>
    </label>
  );
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, resolvedSearchParams, currentProfile, tenantContext] =
    await Promise.all([
      getLocale(),
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
  const tenantName =
    tenantContext.currentTenant?.display_name ?? tenantContext.currentTenant?.name;
  const profile = currentProfile.profile;

  return (
    <div className="mx-auto max-w-5xl space-y-4 text-[var(--ak-text-main)]">
      {saved ? (
        <div className="rounded-[12px] border border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] text-[var(--ak-status-done)]">
          Profilen din ble lagret.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[12px] border border-[var(--ak-status-stuck)] bg-[var(--ak-status-stuck-bg)] text-[var(--ak-status-stuck)]">
          {errorMessage}
        </div>
      ) : null}

      <form action={updateProfileAction}>
        <input type="hidden" name="locale" value={locale} />

        <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
            <h1 className="text-[18px] font-semibold text-[var(--ak-text-main)]">Min profil</h1>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Oppdater informasjonen om kontoen din her.
            </p>
          </div>

          <div className="space-y-6 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-1.5">
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

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="preferredLocale">Språk</Label>
                <SelectNative
                  id="preferredLocale"
                  name="preferredLocale"
                  defaultValue={profile.preferredLocale}
                >
                  <option value="no">Norsk Bokmål</option>
                  <option value="en">English</option>
                </SelectNative>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="themePreference">Tema</Label>
                <SelectNative
                  id="themePreference"
                  name="themePreference"
                  defaultValue={profile.themePreference}
                >
                  <option value="system">Systemstandard</option>
                  <option value="light">Lys</option>
                  <option value="dark">Mørk</option>
                  <option value="night">Natt</option>
                </SelectNative>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--ak-border-soft)] px-6 py-5">
            <h2 className="text-[16px] font-semibold text-[var(--ak-text-main)]">Varsler</h2>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Velg hvordan du vil holde deg oppdatert.
            </p>

            <div className="mt-4 space-y-3">
              <PreferenceRow
                name="notifyEmail"
                title="E-postvarsler"
                description="Få viktige oppdateringer og påminnelser på e-post."
                defaultChecked={profile.notificationPreferences.email}
              />
              <PreferenceRow
                name="notifyInApp"
                title="Varsler i appen"
                description="Vis oppgaver og hendelser direkte i arbeidsflaten."
                defaultChecked={profile.notificationPreferences.inApp}
              />
              <PreferenceRow
                name="notifyWeeklySummary"
                title="Ukesoppsummering"
                description="Motta en kort oppsummering av aktiviteten din hver uke."
                defaultChecked={profile.notificationPreferences.weeklySummary}
              />
            </div>
          </div>

          <div className="border-t border-[var(--ak-border-soft)] px-6 py-5">
            <h2 className="text-[16px] font-semibold text-[var(--ak-text-main)]">Sikkerhet og konto</h2>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Enkel oversikt nå, mer avanserte valg kommer senere.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
                <p className="text-sm text-[var(--ak-text-muted)]">Workspace</p>
                <p className="mt-1 text-sm font-medium text-[var(--ak-text-main)]">
                  {tenantName ?? "Ikke valgt"}
                </p>
              </div>
              <div className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
                <p className="text-sm text-[var(--ak-text-muted)]">Tilgang</p>
                <p className="mt-1 text-sm font-medium text-[var(--ak-text-main)]">{roleLabel}</p>
              </div>
              <div className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
                <p className="text-sm text-[var(--ak-text-muted)]">Opprettet konto</p>
                <p className="mt-1 text-sm font-medium text-[var(--ak-text-main)]">
                  {formatDate(currentProfile.user.created_at)}
                </p>
              </div>
              <div className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
                <p className="text-sm text-[var(--ak-text-muted)]">Sist innlogget</p>
                <p className="mt-1 text-sm font-medium text-[var(--ak-text-main)]">
                  {formatDate(currentProfile.user.last_sign_in_at)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button type="button" variant="outline" className="w-full justify-start" disabled>
                Endre passord (kommer snart)
              </Button>
              <Button type="button" variant="outline" className="w-full justify-start" disabled>
                Tofaktorautentisering (kommer snart)
              </Button>
            </div>
          </div>

          <div className="flex justify-end border-t border-[var(--ak-border-soft)] px-6 py-4">
            <Button
              type="submit"
              className="min-w-40 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:bg-[var(--ak-accent-hover)]"
            >
              Lagre endringer
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
