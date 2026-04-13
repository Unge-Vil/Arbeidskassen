import { getCurrentTenantActivity } from "@arbeidskassen/supabase";

const actionLabels = {
  INSERT: "Opprettet",
  UPDATE: "Oppdatert",
  DELETE: "Slettet",
} as const;

const tableLabels: Record<string, string> = {
  tenants: "Virksomhet",
  tenant_members: "Tilganger",
  organizations: "Organisasjoner",
  departments: "Avdelinger",
  sub_departments: "Undergrupper",
  audit_logs: "Audit logg",
};

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("no-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AuditLoggPage() {
  const events = (await getCurrentTenantActivity()) ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
          <h1 className="text-[18px] font-semibold text-[var(--ak-text-main)]">Audit logg</h1>
          <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
            Se de siste registrerte endringene i valgt virksomhet.
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          {events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--ak-text-main)]">
                      {actionLabels[event.action]} · {tableLabels[event.tableName] ?? event.tableName}
                    </p>
                    <p className="text-sm text-[var(--ak-text-muted)]">
                      Post {event.recordId.slice(0, 8)} ble oppdatert i tabellen {tableLabels[event.tableName] ?? event.tableName.toLowerCase()}.
                    </p>
                  </div>
                  <span className="text-sm text-[var(--ak-text-muted)]">{formatTimestamp(event.createdAt)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[10px] border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-4 py-4 text-sm text-[var(--ak-text-muted)]">
              Ingen audit-hendelser er registrert ennå.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
