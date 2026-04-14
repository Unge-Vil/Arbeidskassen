import { Badge, Button, Card, CardContent, Input, Label } from "@arbeidskassen/ui";
import { getTranslations } from "next-intl/server";

import { Link } from "../../../../../i18n/routing";

function resolveResourceName(resourceId: string): string {
  const mapping: Record<string, string> = {
    "moterom-a": "Møterom A",
    "lydpakke-pro": "Lydpakke Pro",
    "varebil-ab-12345": "Varebil AB 12345",
  };

  return mapping[resourceId] ?? resourceId.replace(/-/g, " ");
}

export default async function RessursDetaljerPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const t = await getTranslations("bookdetPages.resources.detail");
  const resourceName = resolveResourceName(resourceId);

  return (
    <div className="mx-auto max-w-5xl space-y-5 text-[var(--ak-text-main)]">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link href="/bookdet/ressurser" className="inline-flex text-sm text-[var(--ak-text-muted)] hover:text-[var(--ak-text-main)]">
            ← {t("back")}
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ak-text-main)]">{resourceName}</h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/bookdet/sok-book">{t("portalAction")}</Link>
          </Button>
          <Button type="button">{t("save")}</Button>
        </div>
      </section>

      <div className="flex items-center justify-between rounded-xl border border-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ak-status-done)]">{t("publishedTitle")}</p>
          <p className="text-sm text-[var(--ak-text-muted)]">{t("publishedDescription")}</p>
        </div>
        <Badge className="bg-[var(--ak-bg-card)] text-[var(--ak-text-main)]">{t("visible")}</Badge>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-2">
        <span className="rounded-[8px] bg-[var(--ak-bg-main)] px-3 py-2 text-sm font-medium text-[var(--ak-text-main)]">
          {t("tabs.general")}
        </span>
        <span className="rounded-[8px] px-3 py-2 text-sm text-[var(--ak-text-muted)]">{t("tabs.location")}</span>
        <span className="rounded-[8px] px-3 py-2 text-sm text-[var(--ak-text-muted)]">{t("tabs.rules")}</span>
        <span className="rounded-[8px] px-3 py-2 text-sm text-[var(--ak-text-muted)]">{t("tabs.slots")}</span>
      </div>

      <Card className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
        <CardContent className="space-y-5 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_160px_160px]">
            <div className="space-y-2">
              <Label htmlFor="name">{t("fields.name")}</Label>
              <Input id="name" defaultValue={resourceName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">{t("fields.capacity")}</Label>
              <Input id="capacity" defaultValue="20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">{t("fields.size")}</Label>
              <Input id="size" placeholder="25" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("fields.description")}</Label>
            <textarea
              id="description"
              defaultValue={t("descriptionValue")}
              className="min-h-[120px] w-full rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-sm text-[var(--ak-text-main)]"
            />
          </div>

          <div className="space-y-3">
            <Label>{t("fields.images")}</Label>
            <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]">
                <div className="aspect-[4/3] bg-[linear-gradient(135deg,rgba(79,93,214,0.16),rgba(79,93,214,0.04))]" />
                <div className="border-t border-[var(--ak-border-soft)] px-3 py-2 text-xs text-[var(--ak-text-muted)]">
                  {t("mainImage")}
                </div>
              </div>
              <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--ak-border)] bg-[var(--ak-bg-main)] px-4 py-6 text-center text-sm text-[var(--ak-text-muted)]">
                {t("uploadPlaceholder")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
