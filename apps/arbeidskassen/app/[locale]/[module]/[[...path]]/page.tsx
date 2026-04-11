import { notFound, redirect } from "next/navigation";
import {
  ModuleComingSoonPage,
  buildArbeidskassenHref,
  resolveAdminAppHrefs,
} from "@arbeidskassen/ui";

type ModuleKey = "bookdet" | "organisasjon" | "today" | "teamarea" | "backoffice" | "sales-portal";
type AppHrefKey = "booking" | "organization" | "today" | "teamarea" | "backoffice" | "salesPortal";

type ModuleDefinition = {
  appName: string;
  hrefKey: AppHrefKey;
  workspaceInitial: string;
  badge: string;
  title: string;
  description: string;
};

const moduleDefinitions: Record<ModuleKey, ModuleDefinition> = {
  bookdet: {
    appName: "BookDet",
    hrefKey: "booking",
    workspaceInitial: "B",
    badge: "Én samlet app",
    title: "BookDet lever under hoveddomenet",
    description:
      "Denne stien er den kanoniske inngangen til BookDet i Arbeidskassen. I én-prosjekt-modellen kan hovedappen eie URL-en direkte, mens en eventuell `BOOKDET_APP_URL` senere bare er en valgfri proxy for drift og skalering.",
  },
  organisasjon: {
    appName: "Organisasjon",
    hrefKey: "organization",
    workspaceInitial: "O",
    badge: "Én samlet app",
    title: "Organisasjon er en fast modulsti på hoveddomenet",
    description:
      "Organisasjon er tenkt som en del av den samme produktopplevelsen under Arbeidskassen-domenet. Dere trenger ikke en egen deploy for å eie URL-en — den er allerede låst som del av hovedappen.",
  },
  today: {
    appName: "Today",
    hrefKey: "today",
    workspaceInitial: "T",
    badge: "Preview-modul",
    title: "Today er integrert i hoveddomenets rutemodell",
    description:
      "Today bruker samme kanoniske hoveddomene-sti som resten av produktet. Om dere senere ønsker å splitte driftsmessig, kan samme URL fortsatt proxye videre uten at brukeropplevelsen endres.",
  },
  teamarea: {
    appName: "TeamArea",
    hrefKey: "teamarea",
    workspaceInitial: "T",
    badge: "Preview-modul",
    title: "TeamArea er en del av den samlede app-opplevelsen",
    description:
      "TeamArea følger den samme én-produkt-modellen som resten av Arbeidskassen. Hovedappen eier inngangen, og eventuell ekstern kobling senere er bare en teknisk mulighet — ikke et krav.",
  },
  backoffice: {
    appName: "Backoffice",
    hrefKey: "backoffice",
    workspaceInitial: "B",
    badge: "Intern modul",
    title: "Backoffice har en stabil intern hoveddomene-sti",
    description:
      "Backoffice kan ligge bak den samme hovedappen og domenestrukturen. En egen deploy er kun aktuelt hvis dere senere vil skille drift eller tilgang hardere, ikke fordi URL-en krever det.",
  },
  "sales-portal": {
    appName: "Sales Portal",
    hrefKey: "salesPortal",
    workspaceInitial: "S",
    badge: "Intern modul",
    title: "Sales Portal passer inn i den samme én-app-modellen",
    description:
      "Sales Portal kan eksponeres under hoveddomenet på lik linje med de andre modulene. Egen deploy er valgfritt og påvirker ikke den offentlige URL-kontrakten.",
  },
};

function isKnownModule(value: string): value is ModuleKey {
  return value in moduleDefinitions;
}

function joinTarget(baseHref: string, pathSegments: string[]) {
  if (pathSegments.length === 0) {
    return baseHref;
  }

  const trimmedBase = baseHref.replace(/\/$/, "");
  return `${trimmedBase}/${pathSegments.join("/")}`;
}

function isExternalHref(value: string) {
  return /^https?:\/\//.test(value);
}

export default async function ModuleFallbackPage({
  params,
}: {
  params: Promise<{ locale: string; module: string; path?: string[] }>;
}) {
  const { locale, module, path = [] } = await params;

  if (!isKnownModule(module)) {
    notFound();
  }

  const moduleDefinition = moduleDefinitions[module];
  const appHrefs = resolveAdminAppHrefs(locale);
  const targetBaseHref = appHrefs[moduleDefinition.hrefKey];
  const targetHref = joinTarget(targetBaseHref, path);

  if (isExternalHref(targetHref)) {
    redirect(targetHref);
  }

  return (
    <ModuleComingSoonPage
      appName={moduleDefinition.appName}
      workspaceInitial={moduleDefinition.workspaceInitial}
      activeModule={module}
      orgName="Arbeidskassen"
      badge={moduleDefinition.badge}
      title={moduleDefinition.title}
      description={moduleDefinition.description}
      primaryAction={{
        label: "Til dashboard",
        href: buildArbeidskassenHref(locale, "/dashboard"),
      }}
      secondaryAction={{
        label: "Åpne login",
        href: buildArbeidskassenHref(locale, "/login"),
      }}
      moduleHrefs={{
        dashboard: buildArbeidskassenHref(locale, "/dashboard"),
        booking: appHrefs.booking,
        organization: appHrefs.organization,
        today: appHrefs.today,
        teamarea: appHrefs.teamarea,
        backoffice: appHrefs.backoffice,
        salesPortal: appHrefs.salesPortal,
      }}
      statusItems={[
        {
          label: "App-modus",
          value: "Én samlet app",
          detail: "Hoveddomenet eier denne modulstien som del av Arbeidskassen-produktet.",
        },
        {
          label: "Driftsmodus",
          value: isExternalHref(targetBaseHref) ? "Valgfri proxy aktiv" : "Direkte i hovedappen",
          detail: isExternalHref(targetBaseHref)
            ? "Det er satt en ekstern modul-URL, men brukeren beholder fortsatt samme kanoniske hoveddomene-sti."
            : "Ingen ekstern modul-URL er nødvendig for å eie denne ruten; hovedappen håndterer den selv.",
        },
        {
          label: "Kanonisk sti",
          value: `/${locale}/${module}`,
          detail: "Dette er den faste primær-URL-en for modulen på hoveddomenet.",
        },
      ]}
      featureCards={[
        {
          title: "Én stabil inngang",
          description: "Brukeren møter den samme modul-URL-en på hoveddomenet i stedet for å forholde seg til flere separate app-adresser.",
          badge: "Produktmodell",
          icon: "✅",
        },
        {
          title: "Valgfri skalering senere",
          description: "Hvis dere senere ønsker egne deploys av driftshensyn, kan samme URL fortsatt proxye videre uten å endre brukeropplevelsen.",
          badge: "Ops",
          icon: "🔌",
        },
        {
          title: "Samme URL-kontrakt",
          description: "Mønsteret `/{locale}/{app}/...` beholdes uansett om modulen rendres direkte i hovedappen eller via en valgfri proxy.",
          badge: "Kontrakt",
          icon: "🧭",
        },
      ]}
      milestones={[
        {
          title: "Hoveddomenet eier ruten",
          description: "Modulstien er nå en fast del av Arbeidskassen-opplevelsen og ender ikke i en hard 404.",
        },
        {
          title: "Egen deploy er valgfri",
          description: "Separate moduldeploys kan legges til senere for drift eller skalering, men er ikke nødvendig for produktmodellen.",
        },
        {
          title: "Gradvis innfasing av mer modulinnhold",
          description: "Neste steg er å fylle disse inngangene med mer av den faktiske modulfunksjonaliteten under samme hoveddomene.",
        },
      ]}
    />
  );
}
