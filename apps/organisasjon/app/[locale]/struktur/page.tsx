import { Card, CardContent, CardHeader, CardTitle } from "@arbeidskassen/ui";

const priorities = [
  "Organisasjoner, avdelinger og underavdelinger",
  "Tydelig tenant-hierarki med framtidig CRUD-støtte",
  "Forberede grunnlag for flytting og omstrukturering",
];

export default function StrukturPage() {
  return (
    <div className="space-y-6 text-[var(--ak-text-main)]">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--ak-accent)]">Organisasjonskart og oppbygning</p>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Struktur</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ak-text-muted)] sm:text-base">
            En settings-side for struktur skal føles lik alle andre deler av produktet — med samme tokens, spacing og navigasjon.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-lg">
            <span aria-hidden>🧭</span>
          </div>
          <div>
            <CardTitle>Plan for strukturmodulen</CardTitle>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Her samles fremtidig hierarki og organisasjonsendringer i samme settings-opplevelse.
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
