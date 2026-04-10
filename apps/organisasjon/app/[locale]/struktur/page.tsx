import { Button } from "@arbeidskassen/ui";
import { getCurrentTenantStructure } from "@arbeidskassen/supabase";

function formatMembers(count: number): string {
  return `${count} ${count === 1 ? "medlem" : "medlemmer"}`;
}

export default async function StrukturPage() {
  const structure = await getCurrentTenantStructure();
  const organizations = structure?.organizations ?? [];
  const departments = structure?.departments ?? [];
  const subDepartments = structure?.subDepartments ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
          <h1 className="text-[18px] font-semibold text-[var(--ak-text-main)]">Struktur</h1>
          <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
            Denne oversikten er nå koblet til ekte organisasjonsdata for valgt tenant.
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
                <div key={organization.id} className="rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                  <p className="text-sm font-medium text-[var(--ak-text-main)]">{organization.name}</p>
                  <p className="text-xs text-[var(--ak-text-muted)]">
                    {organization.departmentCount} avdelinger · {organization.subDepartmentCount} undergrupper
                  </p>
                  <p className="mt-1 text-xs text-[var(--ak-text-muted)]">{formatMembers(organization.memberCount)}</p>
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
                <div key={department.id} className="rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                  <p className="text-sm font-medium text-[var(--ak-text-main)]">{department.name}</p>
                  <p className="text-xs text-[var(--ak-text-muted)]">{department.orgName ?? "Uten virksomhet"}</p>
                  <p className="mt-1 text-xs text-[var(--ak-text-muted)]">
                    {department.subDepartmentCount} undergrupper · {formatMembers(department.memberCount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--ak-text-muted)]">Ingen avdelinger opprettet ennå.</p>
            )}
          </article>

          <article className="space-y-3 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] p-3">
            <div>
              <p className="text-sm font-semibold text-[var(--ak-text-main)]">Undergrupper</p>
              <p className="text-xs text-[var(--ak-text-muted)]">{subDepartments.length} registrert</p>
            </div>
            {subDepartments.length > 0 ? (
              subDepartments.map((subDepartment) => (
                <div key={subDepartment.id} className="rounded-[8px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2">
                  <p className="text-sm font-medium text-[var(--ak-text-main)]">{subDepartment.name}</p>
                  <p className="text-xs text-[var(--ak-text-muted)]">
                    {subDepartment.departmentName ?? "Uten avdeling"}
                    {subDepartment.orgName ? ` · ${subDepartment.orgName}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ak-text-muted)]">{formatMembers(subDepartment.memberCount)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--ak-text-muted)]">Ingen undergrupper opprettet ennå.</p>
            )}
          </article>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--ak-border-soft)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--ak-text-muted)]">
            Totalt {organizations.length + departments.length + subDepartments.length} strukturenheter i valgt tenant.
          </p>
          <Button
            type="button"
            disabled
            className="min-w-36 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Oppretting kommer snart
          </Button>
        </div>
      </section>
    </div>
  );
}
