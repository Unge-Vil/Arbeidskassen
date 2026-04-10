import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@arbeidskassen/ui";
import {
  createServerClient,
  getEffectiveRole,
  getTenantContext,
  type Database,
} from "@arbeidskassen/supabase";
import { updateTenantSettingsAction } from "../../actions/tenant";

type TenantDetails = Pick<
  Database["public"]["Tables"]["tenants"]["Row"],
  | "id"
  | "name"
  | "slug"
  | "display_name"
  | "legal_name"
  | "organization_number"
  | "phone"
  | "website"
  | "billing_email"
  | "billing_method"
  | "locale"
  | "timezone"
  | "logo_url"
  | "fiscal_year_start_month"
  | "working_hours"
  | "plan"
  | "plan_status"
  | "updated_at"
>;

const monthOptions = [
  { value: 1, label: "Januar" },
  { value: 2, label: "Februar" },
  { value: 3, label: "Mars" },
  { value: 4, label: "April" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const timezoneOptions = [
  "Europe/Oslo",
  "Europe/Stockholm",
  "Europe/Copenhagen",
  "Europe/London",
  "UTC",
];

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

function formatPlan(plan: TenantDetails["plan"]): string {
  switch (plan) {
    case "starter":
      return "Starter";
    case "professional":
      return "Professional";
    case "enterprise":
      return "Enterprise";
    default:
      return "Free";
  }
}

function formatPlanStatus(status: TenantDetails["plan_status"]): string {
  switch (status) {
    case "active":
      return "Aktiv";
    case "trialing":
      return "Prøveperiode";
    case "past_due":
      return "Forfalt";
    case "canceled":
      return "Avsluttet";
    default:
      return "Ubetalt";
  }
}

function formatBillingMethod(method: TenantDetails["billing_method"]): string {
  return method === "ehf" ? "EHF" : "Stripe";
}

function formatDate(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Ikke tilgjengelig";
  }

  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function getWorkingHoursSummary(value: TenantDetails["working_hours"]): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const summary = value.summary;
    return typeof summary === "string" ? summary : "";
  }

  return "";
}

export default async function VirksomhetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, resolvedSearchParams, tenantContext] = await Promise.all([
    params,
    searchParams,
    getTenantContext(),
  ]);

  if (!tenantContext?.user || !tenantContext.currentTenant) {
    return null;
  }

  const supabase = await createServerClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select(
      `
        id,
        name,
        slug,
        display_name,
        legal_name,
        organization_number,
        phone,
        website,
        billing_email,
        billing_method,
        locale,
        timezone,
        logo_url,
        fiscal_year_start_month,
        working_hours,
        plan,
        plan_status,
        updated_at
      `,
    )
    .eq("id", tenantContext.currentTenant.id)
    .maybeSingle<TenantDetails>();

  const saved = getQueryValue(resolvedSearchParams.saved) === "1";
  const errorMessage = getQueryValue(resolvedSearchParams.error);
  const effectiveRole = getEffectiveRole(tenantContext);
  const roleLabel = formatRole(effectiveRole);
  const canManageSettings = effectiveRole === "owner" || effectiveRole === "admin";

  if (error || !tenant) {
    return (
      <Card className="rounded-3xl border border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle>Kunne ikke laste virksomhetsinfo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--ak-text-muted)]">
          Siden fikk ikke hentet organisasjonsdata akkurat nå. Prøv igjen om litt.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-[var(--ak-bg-main)]">
      <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--ak-accent)]">Tenant-identitet og felles standarder</p>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ak-text-main)]">
              Virksomhet
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--ak-text-muted)] sm:text-base">
              Oppdater juridisk navn, kontaktinformasjon, språk og andre standarder som resten av arbeidsflaten arver fra organisasjonen din — i samme settings-shell og samme design som ellers i Arbeidskassen.
            </p>
          </div>
        </div>

        {saved ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            Virksomhetsinformasjonen ble lagret.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {!canManageSettings ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            Du har {roleLabel.toLowerCase()} og kan se informasjonen, men bare eier eller admin kan lagre endringer.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <form action={updateTenantSettingsAction} className="space-y-6">
            <input type="hidden" name="currentLocale" value={locale} />

            <fieldset disabled={!canManageSettings} className="space-y-6">
              <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Identitet og branding</h2>
                  <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
                    Dette er kjernen i hvordan organisasjonen presenteres på tvers av modulene.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="legalName">Juridisk navn</Label>
                    <Input
                      id="legalName"
                      name="legalName"
                      defaultValue={tenant.legal_name ?? ""}
                      placeholder="F.eks. Unge Vil AS"
                      maxLength={160}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="displayName">Visningsnavn</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      defaultValue={tenant.display_name ?? tenant.name}
                      placeholder="Navnet som vises i appene"
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="organizationNumber">Organisasjonsnummer</Label>
                    <Input
                      id="organizationNumber"
                      name="organizationNumber"
                      defaultValue={tenant.organization_number ?? ""}
                      placeholder="999 999 999"
                      maxLength={32}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="logoUrl">Logo-URL</Label>
                    <Input
                      id="logoUrl"
                      name="logoUrl"
                      defaultValue={tenant.logo_url ?? ""}
                      placeholder="https://... eller /storage/..."
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Kontakt og faktura</h2>
                  <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
                    Felles kontaktpunkter som kan brukes i fremtidige kunde- og fakturaflater.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={tenant.phone ?? ""}
                      placeholder="+47 900 00 000"
                      maxLength={32}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="billingEmail">Faktura-e-post</Label>
                    <Input
                      id="billingEmail"
                      name="billingEmail"
                      type="email"
                      defaultValue={tenant.billing_email ?? ""}
                      placeholder="faktura@virksomhet.no"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="website">Nettsted</Label>
                    <Input
                      id="website"
                      name="website"
                      defaultValue={tenant.website ?? ""}
                      placeholder="www.virksomhet.no"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Språk og standardoppsett</h2>
                  <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
                    Disse innstillingene fungerer som standarder for datoformat, kalender og arbeidsflyt.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="tenantLocale">Standardspråk</Label>
                    <select
                      id="tenantLocale"
                      name="tenantLocale"
                      defaultValue={tenant.locale}
                      className="flex h-10 w-full rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2 text-sm text-[var(--ak-text-main)] outline-none focus:ring-2 focus:ring-[var(--ak-accent)]"
                    >
                      <option value="no">Norsk Bokmål</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="timezone">Tidssone</Label>
                    <select
                      id="timezone"
                      name="timezone"
                      defaultValue={tenant.timezone}
                      className="flex h-10 w-full rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2 text-sm text-[var(--ak-text-main)] outline-none focus:ring-2 focus:ring-[var(--ak-accent)]"
                    >
                      {timezoneOptions.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fiscalYearStartMonth">Start på regnskapsår</Label>
                    <select
                      id="fiscalYearStartMonth"
                      name="fiscalYearStartMonth"
                      defaultValue={String(tenant.fiscal_year_start_month)}
                      className="flex h-10 w-full rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2 text-sm text-[var(--ak-text-main)] outline-none focus:ring-2 focus:ring-[var(--ak-accent)]"
                    >
                      {monthOptions.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="workingHoursSummary">Standard arbeidstid</Label>
                    <Input
                      id="workingHoursSummary"
                      name="workingHoursSummary"
                      defaultValue={getWorkingHoursSummary(tenant.working_hours)}
                      placeholder="F.eks. Man–fre 08:00–16:00"
                      maxLength={120}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <Button type="submit" className="min-w-44" disabled={!canManageSettings}>
                  Lagre virksomhetsinfo
                </Button>
              </div>
            </fieldset>
          </form>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Status nå</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ak-text-muted)]">Aktiv tenant</dt>
                  <dd className="text-right font-medium text-[var(--ak-text-main)]">
                    {tenant.display_name ?? tenant.name}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ak-text-muted)]">Din rolle</dt>
                  <dd className="text-right font-medium text-[var(--ak-text-main)]">{roleLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ak-text-muted)]">Plan</dt>
                  <dd className="text-right font-medium text-[var(--ak-text-main)]">
                    {formatPlan(tenant.plan)} · {formatPlanStatus(tenant.plan_status)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ak-text-muted)]">Fakturametode</dt>
                  <dd className="text-right font-medium text-[var(--ak-text-main)]">
                    {formatBillingMethod(tenant.billing_method)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ak-text-muted)]">Slug</dt>
                  <dd className="text-right font-medium text-[var(--ak-text-main)]">{tenant.slug}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--ak-text-muted)]">Sist oppdatert</dt>
                  <dd className="text-right font-medium text-[var(--ak-text-main)]">
                    {formatDate(tenant.updated_at)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-[var(--ak-text-main)]">Hva styrer denne siden?</h2>
              <div className="mt-4 space-y-3 text-sm text-[var(--ak-text-muted)]">
                <p>Visningsnavn og språk brukes i andre moduler når tenantdata hentes inn som kilde til sannhet.</p>
                <p>Tidssone, regnskapsår og arbeidstid blir standarder som andre flater kan arve videre.</p>
                <p>Brukere, roller, struktur, fakturering og audit-logg ligger klare som neste steg i organisasjonsappen.</p>
              </div>
            </section>
          </aside>
      </div>
    </div>
  );
}
