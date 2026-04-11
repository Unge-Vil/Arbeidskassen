import { ModuleComingSoonPage, resolveAdminAppHrefs } from "@arbeidskassen/ui";
import { getTranslations } from "next-intl/server";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, t] = await Promise.all([params, getTranslations("todayHome")]);
  const appHrefs = resolveAdminAppHrefs(locale)

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
        href: appHrefs.dashboard,
      }}
      secondaryAction={{
        label: t("secondaryAction"),
        href: appHrefs.teamarea,
      }}
      moduleHrefs={{
        dashboard: appHrefs.dashboard,
        booking: appHrefs.booking,
        today: appHrefs.today,
        teamarea: appHrefs.teamarea,
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
