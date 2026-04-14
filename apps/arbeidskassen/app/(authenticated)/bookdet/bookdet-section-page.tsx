import { Card, CardContent, CardHeader, CardTitle } from "@arbeidskassen/ui";
import { Link } from "../../../i18n/routing";

type Highlight = {
  label: string;
  value: string;
  detail: string;
};

type BookdetSectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  panelTitle: string;
  variant: "storefront" | "admin";
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction: {
    label: string;
    href: string;
  };
  highlights: Highlight[];
  checklist: string[];
};

export function BookdetSectionPage({
  eyebrow,
  title,
  description,
  panelTitle,
  variant,
  primaryAction,
  secondaryAction,
  highlights,
  checklist,
}: BookdetSectionPageProps) {
  if (variant === "storefront") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] shadow-sm">
          <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:px-8 lg:py-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-[var(--ak-text-muted)]">
                  {eyebrow}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--ak-text-main)]">{title}</h1>
                <p className="max-w-2xl text-[15px] leading-7 text-[var(--ak-text-dim)]">{description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={primaryAction.href}
                  className="inline-flex items-center rounded-lg bg-[var(--ak-text-main)] px-4 py-2.5 text-sm font-medium text-[var(--ak-bg-card)] transition-opacity hover:opacity-90"
                >
                  {primaryAction.label}
                </Link>
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-4 py-2.5 text-sm font-medium text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)]"
                >
                  {secondaryAction.label}
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] p-4">
              <p className="text-[13px] font-medium text-[var(--ak-text-muted)]">
                {panelTitle}
              </p>
              <div className="mt-3 space-y-3">
                {checklist.map((item) => (
                  <div key={item} className="rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2.5 text-sm text-[var(--ak-text-main)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.label}
              className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-4 py-4 shadow-sm"
            >
              <p className="text-[13px] font-medium text-[var(--ak-text-muted)]">
                {highlight.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--ak-text-main)]">{highlight.value}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--ak-text-dim)]">{highlight.detail}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 text-[var(--ak-text-main)]">
      <section className="overflow-hidden rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[var(--ak-border-soft)] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[20px] font-semibold text-[var(--ak-text-main)]">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--ak-text-muted)]">{description}</p>
        </div>

        <div className="flex flex-wrap gap-3 px-6 pt-5">
          <Link
            href={primaryAction.href}
            className="inline-flex items-center rounded-[10px] bg-[var(--ak-accent)] px-4 py-2.5 text-sm font-medium text-[var(--ak-accent-foreground)] transition-opacity hover:opacity-90"
          >
            {primaryAction.label}
          </Link>
          <Link
            href={secondaryAction.href}
            className="inline-flex items-center rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-4 py-2.5 text-sm font-medium text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)]"
          >
            {secondaryAction.label}
          </Link>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.label}
              className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                {highlight.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--ak-text-main)]">{highlight.value}</p>
              <p className="mt-1 text-sm text-[var(--ak-text-muted)]">{highlight.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <Card className="rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
        <CardHeader>
          <CardTitle>{panelTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-[var(--ak-text-muted)]">
            {checklist.map((item) => (
              <li key={item} className="rounded-[10px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
