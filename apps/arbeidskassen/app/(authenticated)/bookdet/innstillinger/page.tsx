import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, PageHeader } from "@arbeidskassen/ui";
import { getTranslations } from "next-intl/server";

import { Link } from "../../../../i18n/routing";

export default async function InnstillingerPage() {
  const t = await getTranslations("bookdetPages.settings");

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
            <Link href="/bookdet/sjekklister">{t("secondaryAction")}</Link>
          </Button>
          <Button type="button">{t("primaryAction")}</Button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_340px]">
        <div className="space-y-4">
          <Card className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
            <CardHeader className="pb-3">
              <CardTitle>{t("general.title")}</CardTitle>
              <p className="text-sm text-[var(--ak-text-muted)]">{t("general.description")}</p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">{t("fields.defaultDuration")}</Label>
                <Input id="duration" defaultValue="2 timer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancellation">{t("fields.cancellationWindow")}</Label>
                <Input id="cancellation" defaultValue="24 timer" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="approval">{t("fields.approvalMode")}</Label>
                <select
                  id="approval"
                  className="h-11 w-full rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 text-sm text-[var(--ak-text-main)]"
                  defaultValue="manual"
                >
                  <option value="manual">{t("options.manual")}</option>
                  <option value="automatic">{t("options.automatic")}</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
            <CardHeader className="pb-3">
              <CardTitle>{t("portal.title")}</CardTitle>
              <p className="text-sm text-[var(--ak-text-muted)]">{t("portal.description")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">{t("fields.portalHeadline")}</Label>
                <Input id="headline" defaultValue="Book møterom, utstyr og kjøretøy" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">{t("fields.instructions")}</Label>
                <textarea
                  id="instructions"
                  defaultValue="Husk å sjekke tilgjengelighet og eventuelle adgangsregler før du sender inn forespørselen."
                  className="min-h-[120px] w-full rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-sm text-[var(--ak-text-main)]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
          <CardHeader className="pb-3">
            <CardTitle>{t("sidebar.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--ak-text-muted)]">
            <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                {t("sidebar.confirmations")}
              </p>
              <p className="mt-1 font-medium text-[var(--ak-text-main)]">{t("sidebar.confirmationsValue")}</p>
            </div>
            <div className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3">
              <p>{t("sidebar.description")}</p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/bookdet/ressurser">{t("sidebarAction")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
