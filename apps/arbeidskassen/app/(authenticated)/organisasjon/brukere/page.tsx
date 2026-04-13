import { Button, Input, Label } from "@arbeidskassen/ui";
import {
  canManageTenantAdministration,
  getCurrentTenantDirectory,
  getCurrentTenantStructure,
  getEffectiveRole,
  getTenantContext,
  type TenantDirectoryMember,
  type TenantRole,
} from "@arbeidskassen/supabase";

import {
  inviteTenantMemberAction,
  toggleTenantMemberActiveAction,
  updateTenantMemberAction,
} from "../../../actions/members";
import { getLocale } from "next-intl/server";

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

function formatScope(member: TenantDirectoryMember): string {
  if (member.subDepartmentName) {
    return `${member.orgName ?? "Virksomhet"} / ${member.deptName ?? "Avdeling"} / ${member.subDepartmentName}`;
  }

  if (member.deptName) {
    return `${member.orgName ?? "Virksomhet"} / ${member.deptName}`;
  }

  return member.orgName ?? "Virksomhetsnivå";
}

function formatJoinedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("no-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

function getMemberStatusLabel(isActive: boolean): string {
  return isActive ? "Aktiv" : "Inaktiv";
}

function getMemberStatusClasses(isActive: boolean): string {
  return isActive
    ? "border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] text-[var(--ak-status-done)]"
    : "border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] text-[var(--ak-text-muted)]";
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-sm text-[var(--ak-text-main)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-accent)] disabled:cursor-not-allowed disabled:opacity-60";

export default async function BrukerePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, resolvedSearchParams, members, structure, tenantContext] = await Promise.all([
    getLocale(),
    searchParams,
    getCurrentTenantDirectory(),
    getCurrentTenantStructure(),
    getTenantContext(),
  ]);

  if (!tenantContext?.user || !tenantContext.currentTenant) {
    return null;
  }

  const resolvedMembers = members ?? [];
  const organizations = structure?.organizations ?? [];
  const departments = structure?.departments ?? [];
  const subDepartments = structure?.subDepartments ?? [];
  const canManageMembers = canManageTenantAdministration(tenantContext);
  const effectiveRole = getEffectiveRole(tenantContext);
  const activeMembers = resolvedMembers.filter((member) => member.isActive);
  const inactiveMembers = resolvedMembers.filter((member) => !member.isActive);
  const saved = getQueryValue(resolvedSearchParams.saved) === "1";
  const errorMessage = getQueryValue(resolvedSearchParams.error);
  const successMessage = getQueryValue(resolvedSearchParams.message) ?? "Endringen ble lagret.";

  return (
    <div className="mx-auto max-w-5xl space-y-4">
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
            <h1 className="text-[18px] font-semibold text-[var(--ak-text-main)]">Brukere</h1>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Administrer medlemskap, roller og plassering i strukturen for hele plattformen.
            </p>
          </div>
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-2 text-xs text-[var(--ak-text-muted)]">
            Din tilgang: <span className="font-semibold text-[var(--ak-text-main)]">{formatRole(effectiveRole)}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3">
            <p className="text-xs text-[var(--ak-text-muted)]">Aktive medlemmer</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ak-text-main)]">{activeMembers.length}</p>
          </div>
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3">
            <p className="text-xs text-[var(--ak-text-muted)]">Inaktive medlemmer</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ak-text-main)]">{inactiveMembers.length}</p>
          </div>
          <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3">
            <p className="text-xs text-[var(--ak-text-muted)]">Totalt medlemskap</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ak-text-main)]">{resolvedMembers.length}</p>
          </div>
        </div>
      </section>

      {!canManageMembers ? (
        <div className="rounded-[12px] border border-[var(--ak-status-working)] bg-[var(--ak-status-working-bg)] px-3 py-2 text-sm text-[var(--ak-status-working)]">
          Du har lesetilgang til medlemslisten, men bare eier eller admin kan invitere, endre roller og deaktivere medlemskap.
        </div>
      ) : null}

      <fieldset disabled={!canManageMembers}>
        <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
            <h2 className="text-base font-semibold text-[var(--ak-text-main)]">Inviter medlem</h2>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Første versjon bruker registrert bruker-ID. E-postinvitasjon kan kobles på i neste steg.
            </p>
          </div>

          <form action={inviteTenantMemberAction} className="grid gap-4 px-6 py-5 xl:grid-cols-2">
            <input type="hidden" name="currentLocale" value={locale} />
            <div className="space-y-1.5 xl:col-span-2">
              <Label htmlFor="invite-user-id">Bruker-ID</Label>
              <Input
                id="invite-user-id"
                name="userId"
                placeholder="f.eks. 123e4567-e89b-12d3-a456-426614174000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Rolle</Label>
              <select id="invite-role" name="role" className={selectClassName} defaultValue="member">
                <option value="viewer">Lesetilgang</option>
                <option value="member">Medlem</option>
                <option value="admin">Admin</option>
                <option value="owner">Eier</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-org">Virksomhet</Label>
              <select id="invite-org" name="orgId" className={selectClassName} defaultValue="">
                <option value="">Virksomhetsnivå</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                    {organization.isArchived ? " (arkivert)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-dept">Avdeling</Label>
              <select id="invite-dept" name="deptId" className={selectClassName} defaultValue="">
                <option value="">Ingen avdeling</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                    {department.orgName ? ` · ${department.orgName}` : ""}
                    {department.isArchived ? " (arkivert)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-subdept">Underavdeling</Label>
              <select id="invite-subdept" name="subDepartmentId" className={selectClassName} defaultValue="">
                <option value="">Ingen underavdeling</option>
                {subDepartments.map((subDepartment) => (
                  <option key={subDepartment.id} value={subDepartment.id}>
                    {subDepartment.name}
                    {subDepartment.departmentName ? ` · ${subDepartment.departmentName}` : ""}
                    {subDepartment.isArchived ? " (arkivert)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="xl:col-span-2">
              <Button
                type="submit"
                className="min-w-40 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90"
                disabled={!canManageMembers}
              >
                Legg til medlem
              </Button>
            </div>
          </form>
        </section>
      </fieldset>

      <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
          <h2 className="text-base font-semibold text-[var(--ak-text-main)]">Medlemsoversikt</h2>
          <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
            Endre rolle, flytt medlemmet i strukturen og aktiver/deaktiver tilgang ved behov.
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          {resolvedMembers.length > 0 ? (
            resolvedMembers.map((member) => (
              <div
                key={member.id}
                className="space-y-3 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--ak-text-main)]">
                      {member.userLabel}
                      {member.isCurrentUser ? " (deg)" : ""}
                    </p>
                    <p className="text-sm text-[var(--ak-text-muted)]">{formatScope(member)}</p>
                    <p className="mt-1 text-xs text-[var(--ak-text-muted)]">
                      Lagt til {formatJoinedAt(member.joinedAt)} · ID {member.userId.slice(0, 8)}…
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getMemberStatusClasses(member.isActive)}`}>
                      {getMemberStatusLabel(member.isActive)}
                    </span>
                    <span className="inline-flex rounded-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ak-text-dim)]">
                      {formatRole(member.role)}
                    </span>
                  </div>
                </div>

                {canManageMembers ? (
                  <details className="rounded-[8px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                    <summary className="cursor-pointer text-xs font-medium text-[var(--ak-text-main)]">
                      Endre rolle og plassering
                    </summary>
                    <form action={updateTenantMemberAction} className="mt-3 grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="currentLocale" value={locale} />
                      <input type="hidden" name="memberId" value={member.id} />
                      <div className="space-y-1.5">
                        <Label htmlFor={`member-${member.id}-role`}>Rolle</Label>
                        <select
                          id={`member-${member.id}-role`}
                          name="role"
                          className={selectClassName}
                          defaultValue={member.role}
                        >
                          <option value="viewer">Lesetilgang</option>
                          <option value="member">Medlem</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Eier</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`member-${member.id}-org`}>Virksomhet</Label>
                        <select
                          id={`member-${member.id}-org`}
                          name="orgId"
                          className={selectClassName}
                          defaultValue={member.orgId ?? ""}
                        >
                          <option value="">Virksomhetsnivå</option>
                          {organizations.map((organization) => (
                            <option key={organization.id} value={organization.id}>
                              {organization.name}
                              {organization.isArchived ? " (arkivert)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`member-${member.id}-dept`}>Avdeling</Label>
                        <select
                          id={`member-${member.id}-dept`}
                          name="deptId"
                          className={selectClassName}
                          defaultValue={member.deptId ?? ""}
                        >
                          <option value="">Ingen avdeling</option>
                          {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                              {department.orgName ? ` · ${department.orgName}` : ""}
                              {department.isArchived ? " (arkivert)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`member-${member.id}-subdept`}>Underavdeling</Label>
                        <select
                          id={`member-${member.id}-subdept`}
                          name="subDepartmentId"
                          className={selectClassName}
                          defaultValue={member.subDepartmentId ?? ""}
                        >
                          <option value="">Ingen underavdeling</option>
                          {subDepartments.map((subDepartment) => (
                            <option key={subDepartment.id} value={subDepartment.id}>
                              {subDepartment.name}
                              {subDepartment.departmentName ? ` · ${subDepartment.departmentName}` : ""}
                              {subDepartment.isArchived ? " (arkivert)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          className="min-w-40 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90"
                        >
                          Lagre medlem
                        </Button>
                      </div>
                    </form>
                  </details>
                ) : null}

                {canManageMembers ? (
                  <form action={toggleTenantMemberActiveAction} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <input type="hidden" name="currentLocale" value={locale} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <input type="hidden" name="nextIsActive" value={member.isActive ? "false" : "true"} />
                    <p className="text-xs text-[var(--ak-text-muted)]">
                      {member.isCurrentUser
                        ? "Du kan ikke deaktivere ditt eget medlemskap."
                        : member.isActive
                          ? "Deaktiver hvis personen midlertidig ikke skal ha tilgang."
                          : "Aktiver igjen når personen skal inn igjen."}
                    </p>
                    <Button
                      type="submit"
                      disabled={member.isCurrentUser}
                      className="min-w-36 border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] hover:bg-[var(--ak-bg-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {member.isActive ? "Deaktiver" : "Aktiver igjen"}
                    </Button>
                  </form>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[10px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-4 py-4 text-sm text-[var(--ak-text-muted)]">
              Det finnes ingen medlemskap i denne virksomheten ennå.
            </div>
          )}

          <div className="pt-2 text-xs text-[var(--ak-text-muted)]">
            {activeMembers.length} aktive og {inactiveMembers.length} inaktive medlemskap i valgt tenant.
          </div>
        </div>
      </section>
    </div>
  );
}
