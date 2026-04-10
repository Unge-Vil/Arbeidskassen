import { Button } from "@arbeidskassen/ui";
import {
  getCurrentTenantDirectory,
  type TenantDirectoryMember,
  type TenantRole,
} from "@arbeidskassen/supabase";

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

export default async function BrukerePage() {
  const members = (await getCurrentTenantDirectory()) ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
          <h1 className="text-[18px] font-semibold text-[var(--ak-text-main)]">Brukere</h1>
          <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
            Se aktive medlemskap i valgt virksomhet og hvor i strukturen de hører hjemme.
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          {members.length > 0 ? (
            members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-2 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ak-text-main)]">
                    {member.userLabel}
                    {member.isCurrentUser ? " (deg)" : ""}
                  </p>
                  <p className="text-sm text-[var(--ak-text-muted)]">{formatScope(member)}</p>
                  <p className="mt-1 text-xs text-[var(--ak-text-muted)]">
                    Lagt til {formatJoinedAt(member.joinedAt)}
                  </p>
                </div>
                <span className="inline-flex rounded-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ak-text-dim)]">
                  {formatRole(member.role)}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-[10px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-4 py-4 text-sm text-[var(--ak-text-muted)]">
              Det finnes ingen aktive medlemmer i denne virksomheten ennå.
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--ak-text-muted)]">
              {members.length} aktive medlemskap i valgt tenant.
            </p>
            <Button
              type="button"
              disabled
              className="min-w-36 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Invitering kommer snart
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
