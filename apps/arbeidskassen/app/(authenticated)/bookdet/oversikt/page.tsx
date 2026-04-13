import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@arbeidskassen/ui";
import { getTranslations } from "next-intl/server";

import { Link } from "../../../../i18n/routing";

const popularResources = [
  { name: "Møterom A", detail: "8 kommende bookinger" },
  { name: "Lydpakke Pro", detail: "3 kommende bookinger" },
  { name: "Varebil AB 12345", detail: "2 kommende bookinger" },
];

const pendingItems = [
  { title: "Avklar leveringstid for Møterom A", status: "today" },
  { title: "Godkjenn kveldsbooking for ungdomsrådet", status: "awaiting" },
  { title: "Oppdater sjekkliste for lydpakken", status: "draft" },
];

export default async function OversiktPage() {
  const t = await getTranslations("bookdetPages.overview");

  const stats = [
    { label: t("stats.resources"), value: "12", detail: t("stats.resourcesDetail") },
    { label: t("stats.upcoming"), value: "7", detail: t("stats.upcomingDetail") },
    { label: t("stats.pending"), value: "3", detail: t("stats.pendingDetail") },
    { label: t("stats.thisWeek"), value: "18", detail: t("stats.thisWeekDetail") },
  ];

  const statusLabel: Record<string, string> = {
    today: t("queue.today"),
    awaiting: t("queue.awaiting"),
    draft: t("queue.draft"),
  };

  return (
    <div className="space-y-5 text-[var(--ak-text-main)]">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          category={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/bookdet/sok-book">{t("secondaryAction")}</Link>
          </Button>
          <Button asChild>
            <Link href="/bookdet/ressurser">{t("primaryAction")}</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]"
          >
            <CardContent className="space-y-2 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                {stat.label}
              </p>
              <p className="text-3xl font-semibold text-[var(--ak-text-main)]">{stat.value}</p>
              <p className="text-sm text-[var(--ak-text-muted)]">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <Card className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
          <CardHeader className="pb-3">
            <CardTitle>{t("utilization.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-[var(--ak-text-muted)]">
                <span>{t("utilization.label")}</span>
                <span className="font-medium text-[var(--ak-text-main)]">34%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--ak-bg-hover)]">
                <div className="h-2 w-[34%] rounded-full bg-[var(--ak-accent)]" />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3">
                <p className="text-xs text-[var(--ak-text-muted)]">{t("utilization.openSlots")}</p>
                <p className="mt-1 text-lg font-semibold">14</p>
              </div>
              <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3">
                <p className="text-xs text-[var(--ak-text-muted)]">{t("utilization.staffed")}</p>
                <p className="mt-1 text-lg font-semibold">6</p>
              </div>
              <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3">
                <p className="text-xs text-[var(--ak-text-muted)]">{t("utilization.private")}</p>
                <p className="mt-1 text-lg font-semibold">2</p>
              </div>
            </div>

            <p className="text-sm text-[var(--ak-text-muted)]">{t("utilization.detail")}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
          <CardHeader className="pb-3">
            <CardTitle>{t("popular.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {popularResources.map((resource) => (
              <div
                key={resource.name}
                className="flex items-center justify-between rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ak-text-main)]">{resource.name}</p>
                  <p className="text-xs text-[var(--ak-text-muted)]">{resource.detail}</p>
                </div>
                <Badge variant="outline" className="border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
                  {t("popular.badge")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <Card className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
          <CardHeader className="pb-3">
            <CardTitle>{t("queue.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-2 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm font-medium text-[var(--ak-text-main)]">{item.title}</p>
                <Badge variant="outline" className="w-fit border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
                  {statusLabel[item.status]}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
          <CardHeader className="pb-3">
            <CardTitle>{t("nextStep.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--ak-text-muted)]">
            <p>{t("nextStep.description")}</p>
            <ul className="space-y-2">
              <li className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2">
                {t("nextStep.one")}
              </li>
              <li className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2">
                {t("nextStep.two")}
              </li>
              <li className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2">
                {t("nextStep.three")}
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
