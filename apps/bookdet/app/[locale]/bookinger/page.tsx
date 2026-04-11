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

type BookingStatus = "confirmed" | "pending" | "manual";
type BookingPriority = "high" | "normal";

type BookingRow = {
  id: string;
  slot: string;
  resource: string;
  requester: string;
  status: BookingStatus;
  priority: BookingPriority;
};

const bookings: BookingRow[] = [
  {
    id: "b1",
    slot: "11. apr · 10:00–12:00",
    resource: "Møterom A",
    requester: "Ungdomsrådet",
    status: "confirmed",
    priority: "normal",
  },
  {
    id: "b2",
    slot: "11. apr · 17:00–19:00",
    resource: "Lydpakke Pro",
    requester: "Kulturkveld",
    status: "pending",
    priority: "high",
  },
  {
    id: "b3",
    slot: "12. apr · 08:30–10:00",
    resource: "Varebil AB 12345",
    requester: "Frivilligsentralen",
    status: "manual",
    priority: "normal",
  },
];

const statusClassNames: Record<BookingStatus, string> = {
  confirmed: "border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] text-[var(--ak-status-done)]",
  pending:
    "border-[var(--ak-status-working)] bg-[var(--ak-status-working-bg)] text-[var(--ak-status-working)]",
  manual: "border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] text-[var(--ak-text-muted)]",
};

const priorityClassNames: Record<BookingPriority, string> = {
  high: "border-[var(--ak-status-stuck)] bg-[var(--ak-status-stuck-bg)] text-[var(--ak-status-stuck)]",
  normal: "border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] text-[var(--ak-text-muted)]",
};

export default async function BookingerPage() {
  const t = await getTranslations("bookdetPages.bookings");

  const statusLabels: Record<BookingStatus, string> = {
    confirmed: t("statuses.confirmed"),
    pending: t("statuses.pending"),
    manual: t("statuses.manual"),
  };

  const priorityLabels: Record<BookingPriority, string> = {
    high: t("priorities.high"),
    normal: t("priorities.normal"),
  };

  const stats = [
    { label: t("stats.upcoming"), value: "7", detail: t("stats.upcomingDetail") },
    { label: t("stats.awaiting"), value: "3", detail: t("stats.awaitingDetail") },
    { label: t("stats.followUp"), value: "2", detail: t("stats.followUpDetail") },
  ];

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
            <Link href="/oversikt">{t("secondaryAction")}</Link>
          </Button>
          <Button asChild>
            <Link href="/ressurser">{t("primaryAction")}</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
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

      <Card className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
        <CardContent className="space-y-4 px-0 py-0">
          <div className="flex flex-col gap-3 border-b border-[var(--ak-border-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-medium text-[var(--ak-text-main)]">{t("tableTitle")}</p>
              <p className="text-xs text-[var(--ak-text-muted)]">{t("tableDescription")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]">
                {t("filters.today")}
              </Badge>
              <Badge variant="outline" className="border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]">
                {t("filters.week")}
              </Badge>
              <Badge variant="outline" className="border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]">
                {t("filters.manual")}
              </Badge>
            </div>
          </div>

          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("columns.time")}</TableHead>
                <TableHead>{t("columns.resource")}</TableHead>
                <TableHead>{t("columns.requester")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.priority")}</TableHead>
                <TableHead className="text-right">{t("columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium text-[var(--ak-text-main)]">{booking.slot}</TableCell>
                  <TableCell className="text-[var(--ak-text-main)]">{booking.resource}</TableCell>
                  <TableCell className="text-[var(--ak-text-muted)]">{booking.requester}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusClassNames[booking.status]}>
                      {statusLabels[booking.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityClassNames[booking.priority]}>
                      {priorityLabels[booking.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm">
                        {t("actions.open")}
                      </Button>
                      <Button type="button" variant="outline" size="sm">
                        {t("actions.remind")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
