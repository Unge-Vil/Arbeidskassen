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
  const [{ locale }, t] = await Promise.all([params, getTranslations("bookdetHome")]);

  return (
    <ModuleComingSoonPage
      appName="BookDet"
      workspaceInitial="B"
      activeModule="booking"
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
        booking: `/${locale}`,
        today:
          process.env.NODE_ENV === "development"
            ? `http://localhost:3004/${locale}`
            : "/today",
        teamarea: getOrganisasjonHref(locale),
      }}
      statusItems={[
        {
          label: t("status.shellLabel"),
          value: t("status.shellValue"),
          detail: t("status.shellDetail"),
        },
        {
          label: t("status.domainLabel"),
          value: t("status.domainValue"),
          detail: t("status.domainDetail"),
        },
        {
          label: t("status.phaseLabel"),
          value: t("status.phaseValue"),
          detail: t("status.phaseDetail"),
        },
      ]}
      featureCards={[
        {
          title: t("cards.adminTitle"),
          description: t("cards.adminDescription"),
          badge: t("cards.adminBadge"),
          icon: "🧭",
        },
        {
          title: t("cards.customerTitle"),
          description: t("cards.customerDescription"),
          badge: t("cards.customerBadge"),
          icon: "🌍",
        },
        {
          title: t("cards.workflowTitle"),
          description: t("cards.workflowDescription"),
          badge: t("cards.workflowBadge"),
          icon: "📆",
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
