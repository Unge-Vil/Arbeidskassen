import { Button } from "@arbeidskassen/ui";

const billingRows = [
  { label: "Aktiv plan", value: "Professional" },
  { label: "Neste faktura", value: "1. mai 2026" },
  { label: "Beløp", value: "2 490 kr / måned" },
  { label: "Betalingsmåte", value: "Firmakort •••• 4242" },
  { label: "Faktura-epost", value: "faktura@ungevil.no" },
] as const;

export default function FaktureringPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
          <h1 className="text-[18px] font-semibold text-[var(--ak-text-main)]">Fakturering</h1>
          <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
            Se plan, betalingsmåte og fakturadetaljer for virksomheten.
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          {billingRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-medium text-[var(--ak-text-main)]">{row.label}</p>
              <p className="text-sm text-[var(--ak-text-muted)]">{row.value}</p>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button type="button" className="min-w-44 bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] hover:opacity-90">
              Administrer abonnement
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
