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
      <Card className="rounded-xl border border-[var(--ak-status-stuck)] bg-[var(--ak-status-stuck-bg)]">
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
    <div className="mx-auto max-w-5xl space-y-4 text-[var(--ak-text-main)]">
      {saved ? (
        <div className="rounded-[12px] border border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] text-[var(--ak-status-done)]">
          Virksomhetsinformasjonen ble lagret.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[12px] border border-[var(--ak-status-stuck)] bg-[var(--ak-status-stuck-bg)] text-[var(--ak-status-stuck)]">
          {errorMessage}
        </div>
      ) : null}

      {!canManageSettings ? (
        <div className="rounded-[12px] border border-[var(--ak-status-working)] bg-[var(--ak-status-working-bg)] text-[var(--ak-status-working)]">
          Du har {roleLabel.toLowerCase()} og kan se informasjonen, men bare eier eller admin kan lagre endringer.
        </div>
      ) : null}

      <form action={updateTenantSettingsAction}>
        <input type="hidden" name="currentLocale" value={locale} />
        <input type="hidden" name="displayName" value={tenant.display_name ?? tenant.name} />
        <input type="hidden" name="phone" value={tenant.phone ?? ""} />
        <input type="hidden" name="website" value={tenant.website ?? ""} />
        <input type="hidden" name="tenantLocale" value={tenant.locale ?? "no"} />
        <input type="hidden" name="timezone" value={tenant.timezone ?? "Europe/Oslo"} />
        <input type="hidden" name="logoUrl" value={tenant.logo_url ?? ""} />
        <input
          type="hidden"
          name="fiscalYearStartMonth"
          value={String(tenant.fiscal_year_start_month ?? 1)}
        />
        <input
          type="hidden"
          name="workingHoursSummary"
          value={getWorkingHoursSummary(tenant.working_hours)}
        />

        <fieldset disabled={!canManageSettings}>
          <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
              <h1 className="text-[18px] font-semibold text-[var(--ak-text-main)]">Selskapsinformasjon</h1>
              <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
                Oppdater informasjonen om virksomheten din her.
              </p>
            </div>

            <div className="space-y-6 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-1.5">
                  <Label htmlFor="legalName">Selskapsnavn</Label>
                  <Input
                    id="legalName"
                    name="legalName"
                    defaultValue={tenant.legal_name ?? tenant.display_name ?? tenant.name}
                    placeholder="Unge Vil 2026 AS"
                    maxLength={160}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="organizationNumber">Organisasjonsnummer</Label>
                  <Input
                    id="organizationNumber"
                    name="organizationNumber"
                    defaultValue={tenant.organization_number ?? ""}
                    placeholder="987 654 321"
                    maxLength={32}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessAddress">Besøksadresse</Label>
                <Input
                  id="businessAddress"
                  name="businessAddress"
                  defaultValue=""
                  placeholder="Storgata 1, 0155 Oslo"
                />
              </div>

              <div className="max-w-md space-y-1.5">
                <Label htmlFor="billingEmail">Faktura-epost</Label>
                <Input
                  id="billingEmail"
                  name="billingEmail"
                  type="email"
                  defaultValue={tenant.billing_email ?? ""}
                  placeholder="faktura@ungevil.no"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  className="min-w-40 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90"
                  disabled={!canManageSettings}
                >
                  Lagre endringer
                </Button>
              </div>
            </div>
          </section>
        </fieldset>
      </form>
    </div>
  );
}
