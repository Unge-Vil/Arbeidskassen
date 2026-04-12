import { Button, Card, CardContent, Input, PageHeader } from "@arbeidskassen/ui";
import { getTranslations } from "next-intl/server";

import { Link } from "../../../../../../i18n/routing";

const categories = [
  { key: "room", example: "Møterom, kontorplass, sal" },
  { key: "equipment", example: "Prosjektor, kamera, verktøy" },
  { key: "vehicle", example: "Bil, varebil, sykkel" },
  { key: "set", example: "Utstyrspakke, kit" },
] as const;

export default async function NyRessursPage() {
  const t = await getTranslations("bookdetPages.resources.new");

  return (
    <div className="mx-auto max-w-3xl space-y-5 text-[var(--ak-text-main)]">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader category={t("eyebrow")} title={t("title")} description={t("description")} />
        <Button asChild variant="outline">
          <Link href="/bookdet/ressurser">{t("portalAction")}</Link>
        </Button>
      </section>

      <Card className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
        <CardContent className="space-y-6 px-6 py-6">
          <div className="flex items-center justify-center gap-3 text-sm text-[var(--ak-text-muted)]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] ring-1 ring-[var(--ak-border-soft)]">
                1
              </span>
              <span>{t("steps.category")}</span>
            </div>
            <span className="hidden h-px w-8 bg-[var(--ak-border-soft)] sm:block" />
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ak-bg-main)] text-[var(--ak-text-muted)] ring-1 ring-[var(--ak-border-soft)]">
                2
              </span>
              <span>{t("steps.basic")}</span>
            </div>
            <span className="hidden h-px w-8 bg-[var(--ak-border-soft)] sm:block" />
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ak-bg-main)] text-[var(--ak-text-muted)] ring-1 ring-[var(--ak-border-soft)]">
                3
              </span>
              <span>{t("steps.mode")}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{t("question")}</h2>
            <p className="text-sm text-[var(--ak-text-muted)]">{t("help")}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category, index) => (
              <button
                key={category.key}
                type="button"
                className={`rounded-[12px] border px-4 py-4 text-left transition-colors ${
                  index === 0
                    ? "border-[var(--ak-border)] bg-[var(--ak-bg-main)] shadow-sm"
                    : "border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] hover:bg-[var(--ak-bg-hover)]"
                }`}
              >
                <p className="text-base font-semibold text-[var(--ak-text-main)]">{t(`categories.${category.key}.title`)}</p>
                <p className="mt-1 text-sm text-[var(--ak-text-muted)]">{category.example}</p>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="resource-name" className="text-sm font-medium text-[var(--ak-text-main)]">
              {t("nameLabel")}
            </label>
            <Input id="resource-name" placeholder={t("namePlaceholder")} />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="ghost">
              <Link href="/bookdet/ressurser">{t("cancel")}</Link>
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="ghost">
                {t("advancedMode")}
              </Button>
              <Button type="button" disabled>
                {t("next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
