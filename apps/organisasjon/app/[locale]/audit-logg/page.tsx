import { Card, CardContent, CardHeader, CardTitle } from "@arbeidskassen/ui";

const priorities = [
  "Samle viktige hendelser på tvers av moduler",
  "Vise hvem som gjorde hva og når",
  "Klargjøre tenant-sikret historikk og revisjonsspor",
];

export default function AuditLoggPage() {
  return (
    <div className="space-y-6 text-[var(--ak-text-main)]">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--ak-accent)]">Historikk og sporbarhet</p>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit logg</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ak-text-muted)] sm:text-base">
            Også revisjonssporet skal leve i samme settings-shell, med samme visuelle språk og navigasjon som resten av plattformen.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-lg">
            <span aria-hidden>🛡️</span>
          </div>
          <div>
            <CardTitle>Dette kommer i audit-loggen</CardTitle>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Alt av viktige endringer i organisasjonen skal kunne spores herfra.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-[var(--ak-text-main)]">
            {priorities.map((item) => (
              <li key={item} className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
