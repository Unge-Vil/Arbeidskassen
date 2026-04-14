import { Button, Input, Label } from "@arbeidskassen/ui";
import {
  canManageTenantAdministration,
  getCurrentTenantStructure,
  getEffectiveRole,
  getTenantContext,
  type TenantRole,
} from "@arbeidskassen/supabase";

import {
  createDepartmentAction,
  createOrganizationAction,
  createSubDepartmentAction,
  toggleStructureArchiveAction,
  updateDepartmentAction,
  updateOrganizationAction,
  updateSubDepartmentAction,
} from "../../../actions/structure";
import { getLocale } from "next-intl/server";

function formatMembers(count: number): string {
  return `${count} ${count === 1 ? "medlem" : "medlemmer"}`;
}

function getQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

function formatRole(role: TenantRole): string {
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

function getStatusLabel(isArchived: boolean): string {
  return isArchived ? "Arkivert" : "Aktiv";
}

function getStatusClasses(isArchived: boolean): string {
  return isArchived
    ? "border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] text-[var(--ak-text-muted)]"
    : "border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] text-[var(--ak-status-done)]";
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-sm text-[var(--ak-text-main)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-accent)] disabled:cursor-not-allowed disabled:opacity-60";

export default async function StrukturPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, resolvedSearchParams, structure, tenantContext] = await Promise.all([
    getLocale(),
    searchParams,
    getCurrentTenantStructure(),
    getTenantContext(),
  ]);

  if (!tenantContext?.user || !tenantContext.currentTenant) {
    return null;
  }

  const organizations = structure?.organizations ?? [];
  const departments = structure?.departments ?? [];
  const subDepartments = structure?.subDepartments ?? [];
  const activeOrganizations = organizations.filter((organization) => !organization.isArchived);
  const activeDepartments = departments.filter((department) => !department.isArchived);
  const activeSubDepartments = subDepartments.filter((subDepartment) => !subDepartment.isArchived);
  const effectiveRole = getEffectiveRole(tenantContext);
  const canManageStructure = canManageTenantAdministration(tenantContext);
  const saved = getQueryValue(resolvedSearchParams.saved) === "1";
  const errorMessage = getQueryValue(resolvedSearchParams.error);
  const successMessage = getQueryValue(resolvedSearchParams.message) ?? "Endringen ble lagret.";

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {saved ? (
        <div className="rounded-xl border border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] px-3 py-2 text-sm text-[var(--ak-status-done)]">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-[var(--ak-status-stuck)] bg-[var(--ak-status-stuck-bg)] px-3 py-2 text-sm text-[var(--ak-status-stuck)]">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-6 py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-[var(--ak-text-main)]">Struktur</h1>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Bygg virksomheter, avdelinger og underavdelinger som hele plattformen kan bruke.
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-2 text-xs text-[var(--ak-text-muted)]">
            Din tilgang: <span className="font-semibold text-[var(--ak-text-main)]">{formatRole(effectiveRole)}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3">
            <p className="text-xs text-[var(--ak-text-muted)]">Virksomheter</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ak-text-main)]">{activeOrganizations.length}</p>
          </div>
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3">
            <p className="text-xs text-[var(--ak-text-muted)]">Avdelinger</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ak-text-main)]">{activeDepartments.length}</p>
          </div>
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3">
            <p className="text-xs text-[var(--ak-text-muted)]">Underavdelinger</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ak-text-main)]">{activeSubDepartments.length}</p>
          </div>
        </div>
      </section>

      {!canManageStructure ? (
        <div className="rounded-xl border border-[var(--ak-status-working)] bg-[var(--ak-status-working-bg)] px-3 py-2 text-sm text-[var(--ak-status-working)]">
          Du har lesetilgang til strukturen, men bare eier eller admin kan opprette, redigere, flytte og arkivere enheter.
        </div>
      ) : null}

      <fieldset disabled={!canManageStructure}>
        <section className="overflow-hidden rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
            <h2 className="text-base font-semibold text-[var(--ak-text-main)]">Opprett nye enheter</h2>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Første steg i implementasjonen: få strukturen inn i systemet med ekte data og rettigheter.
            </p>
          </div>

          <div className="grid gap-4 px-6 py-5 xl:grid-cols-3">
            <form action={createOrganizationAction} className="space-y-3 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
              <input type="hidden" name="currentLocale" value={locale} />
              <div>
                <p className="text-sm font-semibold text-[var(--ak-text-main)]">Ny virksomhet</p>
                <p className="text-xs text-[var(--ak-text-muted)]">For lokasjon, selskap eller forretningsområde.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organization-name">Navn</Label>
                <Input id="organization-name" name="name" placeholder="Haugesund" maxLength={120} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organization-number">Org.nr. (valgfritt)</Label>
                <Input id="organization-number" name="organizationNumber" placeholder="987 654 321" maxLength={32} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organization-slug">Kortnavn / slug</Label>
                <Input id="organization-slug" name="slug" placeholder="haugesund" maxLength={64} />
              </div>
              <Button type="submit" className="w-full bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90" disabled={!canManageStructure}>
                Opprett virksomhet
              </Button>
            </form>

            <form action={createDepartmentAction} className="space-y-3 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
              <input type="hidden" name="currentLocale" value={locale} />
              <div>
                <p className="text-sm font-semibold text-[var(--ak-text-main)]">Ny avdeling</p>
                <p className="text-xs text-[var(--ak-text-muted)]">Legg avdelingen under en virksomhet.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department-org">Virksomhet</Label>
                <select id="department-org" name="orgId" className={selectClassName} defaultValue="" required disabled={!canManageStructure || activeOrganizations.length === 0}>
                  <option value="" disabled>
                    Velg virksomhet
                  </option>
                  {activeOrganizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department-name">Navn</Label>
                <Input id="department-name" name="name" placeholder="Drift" maxLength={120} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department-description">Beskrivelse</Label>
                <Input id="department-description" name="description" placeholder="F.eks. byggdrift og planlegging" maxLength={280} />
              </div>
              <Button type="submit" className="w-full bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90" disabled={!canManageStructure || activeOrganizations.length === 0}>
                Opprett avdeling
              </Button>
            </form>

            <form action={createSubDepartmentAction} className="space-y-3 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
              <input type="hidden" name="currentLocale" value={locale} />
              <div>
                <p className="text-sm font-semibold text-[var(--ak-text-main)]">Ny underavdeling</p>
                <p className="text-xs text-[var(--ak-text-muted)]">For lag, fagområde eller undergruppe.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subdepartment-dept">Avdeling</Label>
                <select id="subdepartment-dept" name="deptId" className={selectClassName} defaultValue="" required disabled={!canManageStructure || activeDepartments.length === 0}>
                  <option value="" disabled>
                    Velg avdeling
                  </option>
                  {activeDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                      {department.orgName ? ` · ${department.orgName}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subdepartment-name">Navn</Label>
                <Input id="subdepartment-name" name="name" placeholder="Team Sør" maxLength={120} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subdepartment-description">Beskrivelse</Label>
                <Input id="subdepartment-description" name="description" placeholder="F.eks. montasje og service" maxLength={280} />
              </div>
              <Button type="submit" className="w-full bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90" disabled={!canManageStructure || activeDepartments.length === 0}>
                Opprett underavdeling
              </Button>
            </form>
          </div>
        </section>
      </fieldset>

      <section className="overflow-hidden rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
          <h2 className="text-base font-semibold text-[var(--ak-text-main)]">Strukturoversikt</h2>
          <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
            Endringer her blir grunnlaget for tilgang, filtrering og rapportering i alle appene. Du kan også redigere og flytte strukturen direkte herfra.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-5 xl:grid-cols-3">
          <article className="space-y-3 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-3">
            <div>
              <p className="text-sm font-semibold text-[var(--ak-text-main)]">Virksomheter</p>
              <p className="text-xs text-[var(--ak-text-muted)]">{organizations.length} registrert</p>
            </div>
            {organizations.length > 0 ? (
              organizations.map((organization) => (
                <div key={organization.id} className="space-y-2 rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--ak-text-main)]">{organization.name}</p>
                      <p className="text-xs text-[var(--ak-text-muted)]">
                        {organization.departmentCount} avdelinger · {organization.subDepartmentCount} undergrupper
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusClasses(organization.isArchived)}`}>
                      {getStatusLabel(organization.isArchived)}
                    </span>
                  </div>
                  {organization.organizationNumber ? (
                    <p className="text-xs text-[var(--ak-text-muted)]">Org.nr. {organization.organizationNumber}</p>
                  ) : null}
                  <p className="text-xs text-[var(--ak-text-muted)]">{formatMembers(organization.memberCount)}</p>
                  {canManageStructure ? (
                    <details className="rounded-[8px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-2 py-2">
                      <summary className="cursor-pointer text-xs font-medium text-[var(--ak-text-main)]">
                        Rediger virksomhet
                      </summary>
                      <form action={updateOrganizationAction} className="mt-2 space-y-2">
                        <input type="hidden" name="currentLocale" value={locale} />
                        <input type="hidden" name="entityId" value={organization.id} />
                        <div className="space-y-1">
                          <Label htmlFor={`organization-${organization.id}-name`}>Navn</Label>
                          <Input
                            id={`organization-${organization.id}-name`}
                            name="name"
                            defaultValue={organization.name}
                            maxLength={120}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`organization-${organization.id}-number`}>Org.nr.</Label>
                          <Input
                            id={`organization-${organization.id}-number`}
                            name="organizationNumber"
                            defaultValue={organization.organizationNumber ?? ""}
                            maxLength={32}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`organization-${organization.id}-slug`}>Kortnavn / slug</Label>
                          <Input
                            id={`organization-${organization.id}-slug`}
                            name="slug"
                            defaultValue={organization.slug ?? ""}
                            maxLength={64}
                          />
                        </div>
                        <Button type="submit" className="h-8 w-full bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90">
                          Lagre virksomhet
                        </Button>
                      </form>
                    </details>
                  ) : null}
                  {canManageStructure ? (
                    <form action={toggleStructureArchiveAction}>
                      <input type="hidden" name="currentLocale" value={locale} />
                      <input type="hidden" name="entityType" value="organization" />
                      <input type="hidden" name="entityId" value={organization.id} />
                      <input type="hidden" name="nextArchived" value={organization.isArchived ? "false" : "true"} />
                      <Button type="submit" className="h-8 w-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] hover:bg-[var(--ak-bg-hover)]">
                        {organization.isArchived ? "Aktiver igjen" : "Arkiver"}
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--ak-text-muted)]">Ingen virksomheter opprettet ennå.</p>
            )}
          </article>

          <article className="space-y-3 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-3">
            <div>
              <p className="text-sm font-semibold text-[var(--ak-text-main)]">Avdelinger</p>
              <p className="text-xs text-[var(--ak-text-muted)]">{departments.length} registrert</p>
            </div>
            {departments.length > 0 ? (
              departments.map((department) => (
                <div key={department.id} className="space-y-2 rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--ak-text-main)]">{department.name}</p>
                      <p className="text-xs text-[var(--ak-text-muted)]">{department.orgName ?? "Uten virksomhet"}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusClasses(department.isArchived)}`}>
                      {getStatusLabel(department.isArchived)}
                    </span>
                  </div>
                  {department.description ? (
                    <p className="text-xs text-[var(--ak-text-muted)]">{department.description}</p>
                  ) : null}
                  <p className="text-xs text-[var(--ak-text-muted)]">
                    {department.subDepartmentCount} undergrupper · {formatMembers(department.memberCount)}
                  </p>
                  {canManageStructure ? (
                    <details className="rounded-[8px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-2 py-2">
                      <summary className="cursor-pointer text-xs font-medium text-[var(--ak-text-main)]">
                        Rediger eller flytt avdeling
                      </summary>
                      <form action={updateDepartmentAction} className="mt-2 space-y-2">
                        <input type="hidden" name="currentLocale" value={locale} />
                        <input type="hidden" name="entityId" value={department.id} />
                        <div className="space-y-1">
                          <Label htmlFor={`department-${department.id}-name`}>Navn</Label>
                          <Input
                            id={`department-${department.id}-name`}
                            name="name"
                            defaultValue={department.name}
                            maxLength={120}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`department-${department.id}-description`}>Beskrivelse</Label>
                          <Input
                            id={`department-${department.id}-description`}
                            name="description"
                            defaultValue={department.description ?? ""}
                            maxLength={280}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`department-${department.id}-org`}>Flytt til virksomhet</Label>
                          <select
                            id={`department-${department.id}-org`}
                            name="orgId"
                            className={selectClassName}
                            defaultValue={department.orgId}
                            required
                          >
                            {organizations.map((organization) => (
                              <option key={organization.id} value={organization.id}>
                                {organization.name}
                                {organization.isArchived ? " (arkivert)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button type="submit" className="h-8 w-full bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90">
                          Lagre avdeling
                        </Button>
                      </form>
                    </details>
                  ) : null}
                  {canManageStructure ? (
                    <form action={toggleStructureArchiveAction}>
                      <input type="hidden" name="currentLocale" value={locale} />
                      <input type="hidden" name="entityType" value="department" />
                      <input type="hidden" name="entityId" value={department.id} />
                      <input type="hidden" name="nextArchived" value={department.isArchived ? "false" : "true"} />
                      <Button type="submit" className="h-8 w-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] hover:bg-[var(--ak-bg-hover)]">
                        {department.isArchived ? "Aktiver igjen" : "Arkiver"}
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--ak-text-muted)]">Ingen avdelinger opprettet ennå.</p>
            )}
          </article>

          <article className="space-y-3 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-3">
            <div>
              <p className="text-sm font-semibold text-[var(--ak-text-main)]">Underavdelinger</p>
              <p className="text-xs text-[var(--ak-text-muted)]">{subDepartments.length} registrert</p>
            </div>
            {subDepartments.length > 0 ? (
              subDepartments.map((subDepartment) => (
                <div key={subDepartment.id} className="space-y-2 rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--ak-text-main)]">{subDepartment.name}</p>
                      <p className="text-xs text-[var(--ak-text-muted)]">
                        {subDepartment.departmentName ?? "Uten avdeling"}
                        {subDepartment.orgName ? ` · ${subDepartment.orgName}` : ""}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusClasses(subDepartment.isArchived)}`}>
                      {getStatusLabel(subDepartment.isArchived)}
                    </span>
                  </div>
                  {subDepartment.description ? (
                    <p className="text-xs text-[var(--ak-text-muted)]">{subDepartment.description}</p>
                  ) : null}
                  <p className="text-xs text-[var(--ak-text-muted)]">{formatMembers(subDepartment.memberCount)}</p>
                  {canManageStructure ? (
                    <details className="rounded-[8px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-2 py-2">
                      <summary className="cursor-pointer text-xs font-medium text-[var(--ak-text-main)]">
                        Rediger eller flytt underavdeling
                      </summary>
                      <form action={updateSubDepartmentAction} className="mt-2 space-y-2">
                        <input type="hidden" name="currentLocale" value={locale} />
                        <input type="hidden" name="entityId" value={subDepartment.id} />
                        <div className="space-y-1">
                          <Label htmlFor={`subdepartment-${subDepartment.id}-name`}>Navn</Label>
                          <Input
                            id={`subdepartment-${subDepartment.id}-name`}
                            name="name"
                            defaultValue={subDepartment.name}
                            maxLength={120}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`subdepartment-${subDepartment.id}-description`}>Beskrivelse</Label>
                          <Input
                            id={`subdepartment-${subDepartment.id}-description`}
                            name="description"
                            defaultValue={subDepartment.description ?? ""}
                            maxLength={280}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`subdepartment-${subDepartment.id}-dept`}>Flytt til avdeling</Label>
                          <select
                            id={`subdepartment-${subDepartment.id}-dept`}
                            name="deptId"
                            className={selectClassName}
                            defaultValue={subDepartment.deptId}
                            required
                          >
                            {departments.map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.name}
                                {department.orgName ? ` · ${department.orgName}` : ""}
                                {department.isArchived ? " (arkivert)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button type="submit" className="h-8 w-full bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90">
                          Lagre underavdeling
                        </Button>
                      </form>
                    </details>
                  ) : null}
                  {canManageStructure ? (
                    <form action={toggleStructureArchiveAction}>
                      <input type="hidden" name="currentLocale" value={locale} />
                      <input type="hidden" name="entityType" value="subDepartment" />
                      <input type="hidden" name="entityId" value={subDepartment.id} />
                      <input type="hidden" name="nextArchived" value={subDepartment.isArchived ? "false" : "true"} />
                      <Button type="submit" className="h-8 w-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] hover:bg-[var(--ak-bg-hover)]">
                        {subDepartment.isArchived ? "Aktiver igjen" : "Arkiver"}
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--ak-text-muted)]">Ingen undergrupper opprettet ennå.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
