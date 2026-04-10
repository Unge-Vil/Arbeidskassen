import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@arbeidskassen/ui";
import { Link } from "../../i18n/routing";

const sections = [
  {
    href: "/virksomhet",
    title: "Virksomhet",
    description: "Navn, org.nr, logo, språk, tidssone og andre felles standarder.",
    phase: "Fase 1",
    emoji: "🏢",
  },
  {
    href: "/brukere",
    title: "Brukere og roller",
    description: "Inviter brukere, styr tilgang og gi roller på tenant-nivå.",
    phase: "Fase 2",
    emoji: "👥",
  },
  {
    href: "/struktur",
    title: "Struktur",
    description: "Bygg organisasjoner, avdelinger og underavdelinger i ett hierarki.",
    phase: "Fase 3",
    emoji: "🧭",
  },
  {
    href: "/fakturering",
    title: "Fakturering",
    description: "Abonnement, betalingsmetoder og fakturahistorikk for virksomheten.",
    phase: "Fase 4",
    emoji: "💳",
  },
  {
    href: "/audit-logg",
    title: "Audit logg",
    description: "Se viktige hendelser og endringer på tvers av hele organisasjonen.",
    phase: "Fase 4",
    emoji: "🛡️",
  },
] as const;

const milestones = [
  {
    title: "MVP nå",
    description: "Egen inngang fra profilmenyen og en samlet oversikt for organisasjonsinnstillinger.",
  },
  {
    title: "Neste steg",
    description: "Gjøre virksomhetsinfo redigerbar med server actions og tenant-sikret lagring.",
  },
  {
    title: "Deretter",
    description: "Bygge brukeradministrasjon, struktur og fakturering som egne områder i appen.",
  },
] as const;

export default function Home() {
  return (
    <div className="space-y-6 text-[var(--ak-text-main)]">
      <section className="rounded-[28px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-6 shadow-sm sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ak-text-muted)]">
          <span aria-hidden>🏢</span>
          Organisasjon
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Organisasjonsinnstillinger samlet på ett sted
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ak-text-muted)] sm:text-[15px]">
          Hele organisasjonsflaten følger nå samme navigasjon, tema og designprinsipper som resten av Arbeidskassen. Herfra styrer du virksomhetsinfo, tilgang, struktur og fakturering.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/virksomhet">Åpne virksomhet →</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/brukere">Gå til brukere og roller</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.href} className="rounded-2xl">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-lg">
                  <span aria-hidden>{section.emoji}</span>
                </div>
                <span className="rounded-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ak-text-muted)]">
                  {section.phase}
                </span>
              </div>
              <div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription className="mt-1.5 text-[13px] leading-5">
                  {section.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="w-full justify-between">
                <Link href={section.href}>
                  Gå til område
                  <span aria-hidden>→</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {milestones.map((milestone) => (
          <Card key={milestone.title} className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">{milestone.title}</CardTitle>
              <CardDescription className="text-[13px] leading-5">
                {milestone.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
