import {
  Badge,
  Button,
  Card,
  CardContent,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@arbeidskassen/ui";
import { getTranslations } from "next-intl/server";

import { Link } from "../../../i18n/routing";

type ResourceStatus = "active" | "maintenance" | "draft";
type ResourceAvailability = "open" | "restricted" | "private";

type ResourceRow = {
  slug: string;
  name: string;
  category: string;
  meta: string;
  availability: ResourceAvailability;
  status: ResourceStatus;
};

const resources: ResourceRow[] = [
  {
    slug: "moterom-a",
    name: "Møterom A",
    category: "Rom",
    meta: "20 personer · prosjektor · sentrum",
    availability: "open",
    status: "active",
  },
  {
    slug: "lydpakke-pro",
    name: "Lydpakke Pro",
    category: "Utstyr",
    meta: "Mikser + 2 høyttalere · lager 2",
    availability: "restricted",
    status: "maintenance",
  },
  {
    slug: "varebil-ab-12345",
    name: "Varebil AB 12345",
    category: "Kjøretøy",
    meta: "6 seter · krever nøkkelutlevering",
    availability: "private",
    status: "draft",
  },
];

const statusClassNames: Record<ResourceStatus, string> = {
  active: "border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] text-[var(--ak-status-done)]",
  maintenance:
    "border-[var(--ak-status-working)] bg-[var(--ak-status-working-bg)] text-[var(--ak-status-working)]",
  draft: "border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] text-[var(--ak-text-muted)]",
};

const availabilityClassNames: Record<ResourceAvailability, string> = {
  open: "border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] text-[var(--ak-status-done)]",
  restricted:
    "border-[var(--ak-status-working)] bg-[var(--ak-status-working-bg)] text-[var(--ak-status-working)]",
  private: "border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] text-[var(--ak-text-muted)]",
};

export default async function RessurserPage() {
  const t = await getTranslations("bookdetPages.resources");

  const statusLabels: Record<ResourceStatus, string> = {
    active: t("statuses.active"),
    maintenance: t("statuses.maintenance"),
    draft: t("statuses.draft"),
  };

  const availabilityLabels: Record<ResourceAvailability, string> = {
    open: t("availability.open"),
    restricted: t("availability.restricted"),
    private: t("availability.private"),
  };

  const stats = [
    { label: t("stats.total"), value: "12", detail: t("stats.totalDetail") },
    { label: t("stats.bookableToday"), value: "8", detail: t("stats.bookableTodayDetail") },
    { label: t("stats.maintenance"), value: "2", detail: t("stats.maintenanceDetail") },
    { label: t("stats.private"), value: "2", detail: t("stats.privateDetail") },
  ];

  return (
    <div className="w-full max-w-none space-y-5 text-[var(--ak-text-main)]">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          category={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/sok-book">{t("secondaryAction")}</Link>
          </Button>
          <Button asChild>
            <Link href="/ressurser/ny">{t("primaryAction")}</Link>
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

      <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-2 border-b border-[var(--ak-border-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm font-medium text-[var(--ak-text-main)]">{t("tableTitle")}</p>
          <p className="text-xs text-[var(--ak-text-muted)]">{t("tableDescription")}</p>
        </div>

        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.category")}</TableHead>
              <TableHead>{t("columns.availability")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="text-right">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.slug}>
                <TableCell>
                  <div>
                    <p className="font-medium text-[var(--ak-text-main)]">{resource.name}</p>
                    <p className="text-xs text-[var(--ak-text-muted)]">{resource.meta}</p>
                  </div>
                </TableCell>
                <TableCell className="text-[var(--ak-text-muted)]">{resource.category}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={availabilityClassNames[resource.availability]}>
                    {availabilityLabels[resource.availability]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusClassNames[resource.status]}>
                    {statusLabels[resource.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild type="button" variant="ghost" size="sm">
                      <Link href={`/ressurser/${resource.slug}`}>{t("actions.edit")}</Link>
                    </Button>
                    <Button type="button" variant="outline" size="sm">
                      {t("actions.preview")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
