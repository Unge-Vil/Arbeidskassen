import { Card, CardContent, CardHeader, CardTitle } from "@arbeidskassen/ui";

const priorities = [
  "Invitere nye brukere til tenant",
  "Tildele owner/admin/member/viewer-roller",
  "Deaktivere tilgang uten å miste historikk",
];

export default function BrukerePage() {
  return (
    <div className="space-y-6 text-[var(--ak-text-main)]">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--ak-accent)]">Tilgang og medlemskap</p>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brukere og roller</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ak-text-muted)] sm:text-base">
            Denne siden følger samme shell og tema som resten av systemet, og blir hjemmet for invitasjoner, roller og tilgangsstyring.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-lg">
            <span aria-hidden>👥</span>
          </div>
          <div>
            <CardTitle>Prioriteringer i denne delen</CardTitle>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Her bygger vi den neste settings-flaten i samme designretning som `Virksomhet`.
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
