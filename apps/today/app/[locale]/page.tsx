import { ModuleComingSoonPage } from "@arbeidskassen/ui";
import { getTranslations } from "next-intl/server";

function getArbeidskassenHref(locale: string, path = ""): string {
  const configuredBase =
    process.env.ARBEIDSKASSEN_APP_URL ??
    process.env.WEB_APP_URL ??
    process.env.NEXT_PUBLIC_WEB_APP_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const trimmedBase = configuredBase.trim().replace(/\/$/, "");

  if (!trimmedBase) {
    return `/${locale}${normalizedPath}`;
  }

  return `${trimmedBase}/${locale}${normalizedPath}`;
}

function getOrganisasjonHref(locale: string): string {
  const configuredBase =
    process.env.ORGANISASJON_APP_URL ??
    process.env.ORGANIZATION_APP_URL ??
    process.env.NEXT_PUBLIC_ORGANISASJON_URL ??
    process.env.NEXT_PUBLIC_ORGANIZATION_APP_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3002" : "/organisasjon");

  const trimmedBase = configuredBase.trim().replace(/\/$/, "");

  if (trimmedBase.includes("{locale}")) {
    return trimmedBase.replace("{locale}", locale);
  }

  if (trimmedBase.startsWith("http://") || trimmedBase.startsWith("https://")) {
    return trimmedBase.endsWith(`/${locale}`) ? trimmedBase : `${trimmedBase}/${locale}`;
  }

  return trimmedBase || "/organisasjon";
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, t] = await Promise.all([params, getTranslations("todayHome")]);

  return (
    <ModuleComingSoonPage
      appName="Today"
      workspaceInitial="T"
      activeModule="today"
      orgName="Arbeidskassen"
      badge={t("badge")}
      title={t("title")}
      description={t("description")}
      primaryAction={{
        label: t("primaryAction"),
        href: getArbeidskassenHref(locale, "/"),
      }}
      secondaryAction={{
        label: t("secondaryAction"),
        href: getOrganisasjonHref(locale),
      }}
      moduleHrefs={{
        dashboard: getArbeidskassenHref(locale, "/"),
        booking:
          process.env.NODE_ENV === "development"
            ? `http://localhost:3001/${locale}`
            : "/bookdet",
        today: `/${locale}`,
        teamarea: getOrganisasjonHref(locale),
      }}
      statusItems={[
        {
          label: t("status.shellLabel"),
          value: t("status.shellValue"),
          detail: t("status.shellDetail"),
        },
        {
          label: t("status.scopeLabel"),
          value: t("status.scopeValue"),
          detail: t("status.scopeDetail"),
        },
        {
          label: t("status.phaseLabel"),
          value: t("status.phaseValue"),
          detail: t("status.phaseDetail"),
        },
      ]}
      featureCards={[
        {
          title: t("cards.planningTitle"),
          description: t("cards.planningDescription"),
          badge: t("cards.planningBadge"),
          icon: "✅",
        },
        {
          title: t("cards.collaborationTitle"),
          description: t("cards.collaborationDescription"),
          badge: t("cards.collaborationBadge"),
          icon: "🤝",
        },
        {
          title: t("cards.platformTitle"),
          description: t("cards.platformDescription"),
          badge: t("cards.platformBadge"),
          icon: "🧩",
        },
      ]}
      milestones={[
        {
          title: t("milestones.oneTitle"),
          description: t("milestones.oneDescription"),
        },
        {
          title: t("milestones.twoTitle"),
          description: t("milestones.twoDescription"),
        },
        {
          title: t("milestones.threeTitle"),
          description: t("milestones.threeDescription"),
        },
      ]}
    />
  );
}
