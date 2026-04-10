import { Card, CardContent, CardHeader, CardTitle } from "@arbeidskassen/ui";

const priorities = [
  "Se aktiv plan og abonnementsstatus",
  "Samle betalingsmetoder og fakturahistorikk",
  "Forberede Stripe- og EHF-flyt i neste iterasjon",
];

export default function FaktureringPage() {
  return (
    <div className="space-y-6 text-[var(--ak-text-main)]">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--ak-accent)]">Abonnement og betaling</p>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fakturering</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ak-text-muted)] sm:text-base">
            Denne delen skal se og føles identisk med resten av plattformen, bare tilpasset organisasjonsinnstillinger for plan og betaling.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-lg">
            <span aria-hidden>💳</span>
          </div>
          <div>
            <CardTitle>Plan for faktureringsmodulen</CardTitle>
            <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
              Samme design, samme tokens — bare med fokus på planstatus, betaling og historikk.
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
