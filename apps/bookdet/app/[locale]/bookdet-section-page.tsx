import { Card, CardContent, CardHeader, CardTitle } from "@arbeidskassen/ui";
import { Link } from "../../i18n/routing";

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
        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:px-8 lg:py-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {eyebrow}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
                <p className="max-w-2xl text-[15px] leading-7 text-slate-600">{description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={primaryAction.href}
                  className="inline-flex items-center rounded-[10px] bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  {primaryAction.label}
                </Link>
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {secondaryAction.label}
                </Link>
              </div>
            </div>

            <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {panelTitle}
              </p>
              <div className="mt-3 space-y-3">
                {checklist.map((item) => (
                  <div key={item} className="rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
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
              className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {highlight.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{highlight.value}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{highlight.detail}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 text-[var(--ak-text-main)]">
      <section className="overflow-hidden rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
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
              className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-4 py-4"
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

      <Card className="rounded-[12px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)]">
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
