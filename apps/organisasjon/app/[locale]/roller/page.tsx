import { Button, Input, Label } from "@arbeidskassen/ui";
import {
  canManageTenantAdministration,
  DEFAULT_ROLE_PERMISSIONS,
  getCurrentTenantCustomRoles,
  getCurrentTenantDirectory,
  getEffectiveRole,
  getPermissionDefinitionsByGroup,
  getTenantContext,
  type PlatformPermissionKey,
  type TenantRole,
} from "@arbeidskassen/supabase";

import {
  assignCustomRoleAction,
  createCustomRoleAction,
  revokeCustomRoleAction,
  toggleCustomRoleArchiveAction,
  updateCustomRoleAction,
} from "../../actions/roles";

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

function getQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

function getStatusClasses(isArchived: boolean): string {
  return isArchived
    ? "border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] text-[var(--ak-text-muted)]"
    : "border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] text-[var(--ak-status-done)]";
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-sm text-[var(--ak-text-main)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-accent)] disabled:cursor-not-allowed disabled:opacity-60";

export default async function RollerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, resolvedSearchParams, tenantContext, customRoles, members] = await Promise.all([
    params,
    searchParams,
    getTenantContext(),
    getCurrentTenantCustomRoles(),
    getCurrentTenantDirectory(),
  ]);

  if (!tenantContext?.user || !tenantContext.currentTenant) {
    return null;
  }

  const saved = getQueryValue(resolvedSearchParams.saved) === "1";
  const errorMessage = getQueryValue(resolvedSearchParams.error);
  const successMessage = getQueryValue(resolvedSearchParams.message) ?? "Endringen ble lagret.";
  const effectiveRole = getEffectiveRole(tenantContext);
  const canManageRoles = canManageTenantAdministration(tenantContext);
  const permissionGroups = getPermissionDefinitionsByGroup();
  const memberOptions = (members ?? []).filter((member) => member.isActive);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {saved ? (
        <div className="rounded-[12px] border border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] px-3 py-2 text-sm text-[var(--ak-status-done)]">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[12px] border border-[var(--ak-status-stuck)] bg-[var(--ak-status-stuck-bg)] px-3 py-2 text-sm text-[var(--ak-status-stuck)]">
          {errorMessage}
        </div>
      ) : null}

      <section className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-6 py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-[var(--ak-text-main)]">Roller og tilganger</h1>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Kombiner standardroller med custom roller og granular permissions på tvers av appene.
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-2 text-xs text-[var(--ak-text-muted)]">
            Din tilgang: <span className="font-semibold text-[var(--ak-text-main)]">{formatRole(effectiveRole)}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3">
            <p className="text-xs text-[var(--ak-text-muted)]">Standardroller</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ak-text-main)]">4</p>
          </div>
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3">
            <p className="text-xs text-[var(--ak-text-muted)]">Custom roller</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ak-text-main)]">{customRoles?.length ?? 0}</p>
          </div>
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3">
            <p className="text-xs text-[var(--ak-text-muted)]">Permission-nøkler</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ak-text-main)]">
              {Object.values(permissionGroups).reduce((count, definitions) => count + definitions.length, 0)}
            </p>
          </div>
        </div>
      </section>

      {!canManageRoles ? (
        <div className="rounded-[12px] border border-[var(--ak-status-working)] bg-[var(--ak-status-working-bg)] px-3 py-2 text-sm text-[var(--ak-status-working)]">
          Du kan se rollemodellen, men bare eier eller admin kan opprette custom roller og endre tilganger.
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
          <h2 className="text-base font-semibold text-[var(--ak-text-main)]">Standardroller</h2>
          <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
            Dette er basislaget alle tenants har før de bygger egne roller oppå.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-5 xl:grid-cols-2">
          {(Object.keys(DEFAULT_ROLE_PERMISSIONS) as TenantRole[]).map((roleKey) => (
            <article
              key={roleKey}
              className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ak-text-main)]">{formatRole(roleKey)}</p>
                  <p className="text-xs text-[var(--ak-text-muted)]">
                    {DEFAULT_ROLE_PERMISSIONS[roleKey].length} standardtillatelser
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-[var(--ak-text-muted)]">
                {DEFAULT_ROLE_PERMISSIONS[roleKey].map((permissionKey) => (
                  <li key={permissionKey}>• {permissionKey}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <fieldset disabled={!canManageRoles}>
        <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
            <h2 className="text-base font-semibold text-[var(--ak-text-main)]">Opprett custom rolle</h2>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Sett sammen en rolle med helt konkrete tilganger på tvers av BookDet, Today, AI og Organisasjon.
            </p>
          </div>

          <form action={createCustomRoleAction} className="space-y-4 px-6 py-5">
            <input type="hidden" name="currentLocale" value={locale} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="custom-role-name">Navn</Label>
                <Input id="custom-role-name" name="name" placeholder="Fagansvarlig Today" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-role-slug">Kortnavn / slug</Label>
                <Input id="custom-role-slug" name="slug" placeholder="fagansvarlig-today" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-role-description">Beskrivelse</Label>
              <Input
                id="custom-role-description"
                name="description"
                placeholder="F.eks. kan administrere Today for ett team, men ikke fakturering."
                maxLength={240}
              />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {Object.entries(permissionGroups).map(([groupName, definitions]) => (
                <div key={groupName} className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
                  <p className="text-sm font-semibold text-[var(--ak-text-main)]">{groupName}</p>
                  <div className="mt-3 space-y-2">
                    {definitions.map((definition) => (
                      <label key={definition.key} className="flex gap-3 rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                        <input type="checkbox" name="permissions" value={definition.key} className="mt-1" />
                        <span>
                          <span className="block text-sm font-medium text-[var(--ak-text-main)]">{definition.label}</span>
                          <span className="block text-xs text-[var(--ak-text-muted)]">{definition.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button type="submit" className="min-w-40 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90" disabled={!canManageRoles}>
              Opprett custom rolle
            </Button>
          </form>
        </section>
      </fieldset>

      <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
          <h2 className="text-base font-semibold text-[var(--ak-text-main)]">Eksisterende custom roller</h2>
          <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
            Her kan du finjustere roller og tildele dem til medlemmer uten å endre standardrollene deres.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {customRoles && customRoles.length > 0 ? (
            customRoles.map((role) => (
              <article key={role.id} className="space-y-3 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ak-text-main)]">{role.name}</p>
                    <p className="text-xs text-[var(--ak-text-muted)]">
                      {role.slug} · {role.permissionCount} tillatelser · {role.memberCount} tildelinger
                    </p>
                    {role.description ? (
                      <p className="mt-1 text-sm text-[var(--ak-text-muted)]">{role.description}</p>
                    ) : null}
                  </div>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusClasses(role.isArchived)}`}>
                    {role.isArchived ? "Arkivert" : "Aktiv"}
                  </span>
                </div>

                {role.assignedMembers.length > 0 ? (
                  <div className="rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-xs text-[var(--ak-text-muted)]">
                    Tildelt til: {role.assignedMembers.map((member) => member.memberLabel).join(", ")}
                  </div>
                ) : (
                  <div className="rounded-[8px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-xs text-[var(--ak-text-muted)]">
                    Ingen medlemmer er koblet til denne rollen ennå.
                  </div>
                )}

                {canManageRoles ? (
                  <details className="rounded-[8px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                    <summary className="cursor-pointer text-xs font-medium text-[var(--ak-text-main)]">
                      Rediger rolle og permissions
                    </summary>
                    <form action={updateCustomRoleAction} className="mt-3 space-y-4">
                      <input type="hidden" name="currentLocale" value={locale} />
                      <input type="hidden" name="roleId" value={role.id} />
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`role-${role.id}-name`}>Navn</Label>
                          <Input id={`role-${role.id}-name`} name="name" defaultValue={role.name} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`role-${role.id}-slug`}>Kortnavn / slug</Label>
                          <Input id={`role-${role.id}-slug`} name="slug" defaultValue={role.slug} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`role-${role.id}-description`}>Beskrivelse</Label>
                        <Input
                          id={`role-${role.id}-description`}
                          name="description"
                          defaultValue={role.description ?? ""}
                          maxLength={240}
                        />
                      </div>
                      <div className="grid gap-4 xl:grid-cols-2">
                        {Object.entries(permissionGroups).map(([groupName, definitions]) => (
                          <div key={`${role.id}-${groupName}`} className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-3">
                            <p className="text-sm font-semibold text-[var(--ak-text-main)]">{groupName}</p>
                            <div className="mt-2 space-y-2">
                              {definitions.map((definition) => (
                                <label key={`${role.id}-${definition.key}`} className="flex gap-3 rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                                  <input
                                    type="checkbox"
                                    name="permissions"
                                    value={definition.key}
                                    defaultChecked={role.permissionKeys.includes(definition.key as PlatformPermissionKey)}
                                    className="mt-1"
                                  />
                                  <span>
                                    <span className="block text-sm font-medium text-[var(--ak-text-main)]">{definition.label}</span>
                                    <span className="block text-xs text-[var(--ak-text-muted)]">{definition.description}</span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button type="submit" className="min-w-40 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90">
                        Lagre rolle
                      </Button>
                    </form>
                  </details>
                ) : null}

                {canManageRoles ? (
                  <form action={assignCustomRoleAction} className="grid gap-3 rounded-[8px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <input type="hidden" name="currentLocale" value={locale} />
                    <input type="hidden" name="roleId" value={role.id} />
                    <div className="space-y-1.5">
                      <Label htmlFor={`assign-role-${role.id}`}>Tildel til medlem</Label>
                      <select id={`assign-role-${role.id}`} name="memberId" className={selectClassName} defaultValue="">
                        <option value="" disabled>
                          Velg medlem
                        </option>
                        {memberOptions.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.userLabel}
                            {member.deptName ? ` · ${member.deptName}` : member.orgName ? ` · ${member.orgName}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="min-w-32 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90">
                        Tildel rolle
                      </Button>
                    </div>
                  </form>
                ) : null}

                {canManageRoles && role.assignments.length > 0 ? (
                  <div className="space-y-2 rounded-[8px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-3">
                    <p className="text-xs font-medium text-[var(--ak-text-main)]">Fjern tildeling</p>
                    <div className="space-y-2">
                      {role.assignments.map((assignment) => (
                        <form key={assignment.id} action={revokeCustomRoleAction} className="flex flex-col gap-2 rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                          <input type="hidden" name="currentLocale" value={locale} />
                          <input type="hidden" name="assignmentId" value={assignment.id} />
                          <p className="text-xs text-[var(--ak-text-muted)]">{assignment.memberLabel}</p>
                          <Button type="submit" className="h-8 min-w-28 border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] hover:bg-[var(--ak-bg-hover)]">
                            Fjern
                          </Button>
                        </form>
                      ))}
                    </div>
                  </div>
                ) : null}

                {canManageRoles ? (
                  <form action={toggleCustomRoleArchiveAction}>
                    <input type="hidden" name="currentLocale" value={locale} />
                    <input type="hidden" name="roleId" value={role.id} />
                    <input type="hidden" name="nextArchived" value={role.isArchived ? "false" : "true"} />
                    <Button type="submit" className="min-w-36 border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] hover:bg-[var(--ak-bg-hover)]">
                      {role.isArchived ? "Aktiver igjen" : "Arkiver rolle"}
                    </Button>
                  </form>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[10px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-4 py-4 text-sm text-[var(--ak-text-muted)]">
              Ingen custom roller er opprettet ennå. Start med å definere én rolle for en bestemt app eller arbeidsflyt.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
