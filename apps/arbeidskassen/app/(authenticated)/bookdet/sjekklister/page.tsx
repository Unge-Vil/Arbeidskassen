import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader } from "@arbeidskassen/ui";
import { getTranslations } from "next-intl/server";

import { Link } from "../../../../i18n/routing";

const checklistItems = [
  { label: "Renhold godkjent", type: "yesNo", required: true },
  { label: "Alt utstyr til stede", type: "yesNo", required: true },
  { label: "Bilde av rommet", type: "image", required: true },
  { label: "Kommentar", type: "text", required: false },
];

export default async function SjekklisterPage() {
  const t = await getTranslations("bookdetPages.checklists");

  const typeLabels: Record<string, string> = {
    yesNo: t("types.yesNo"),
    image: t("types.image"),
    text: t("types.text"),
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
            <Link href="/bookdet/bookinger">{t("secondaryAction")}</Link>
          </Button>
          <Button type="button">{t("primaryAction")}</Button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_340px]">
        <Card className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
          <CardHeader className="border-b border-[var(--ak-border-soft)] pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>{t("builderTitle")}</CardTitle>
                <p className="mt-1 text-sm text-[var(--ak-text-muted)]">{t("builderDescription")}</p>
              </div>
              <Badge variant="outline" className="w-fit border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]">
                Møterom A
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline" className="border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]">
                {t("tags.vehicle")}
              </Badge>
              <Badge variant="outline" className="border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]">
                {t("tags.room")}
              </Badge>
              <Badge variant="outline" className="border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]">
                {t("tags.general")}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-4">
            {checklistItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-2 rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm font-medium text-[var(--ak-text-main)]">{item.label}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
                    {typeLabels[item.type]}
                  </Badge>
                  {item.required ? (
                    <Badge className="bg-[var(--ak-status-working)] text-[#1e293b]">{t("required")}</Badge>
                  ) : null}
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-2 rounded-[10px] border border-dashed border-[var(--ak-border)] bg-[var(--ak-bg-main)] px-3 py-3 md:flex-row md:items-center">
              <Input placeholder={t("fieldPlaceholder")} className="md:flex-1" />
              <select className="h-11 rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 text-sm text-[var(--ak-text-main)]">
                <option>{t("types.text")}</option>
                <option>{t("types.yesNo")}</option>
                <option>{t("types.image")}</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-[var(--ak-text-muted)]">
                <input type="checkbox" className="h-4 w-4 rounded border-[var(--ak-border-soft)]" />
                {t("required")}
              </label>
              <Button type="button">{t("addField")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
          <CardHeader className="pb-3">
            <CardTitle>{t("sidebarTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--ak-text-muted)]">
            <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                {t("sidebarLinked")}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--ak-text-main)]">Møterom A</p>
            </div>
            <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3">
              <p>{t("sidebarDescription")}</p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/innstillinger">{t("sidebarAction")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
