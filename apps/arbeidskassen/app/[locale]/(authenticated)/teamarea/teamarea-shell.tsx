"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@arbeidskassen/ui";
import { Link } from "../../../../i18n/routing";

type TeamAreaShellProps = {
  children: ReactNode;
};

export function TeamAreaShell({ children }: TeamAreaShellProps) {
  const { locale } = useParams<{ locale: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("teamareaShell");

  const currentView = searchParams.get("view") ?? "feed";
  const currentGroup = searchParams.get("group") ?? "all-hands";

  const teamareaBase = `/${locale}/teamarea`;

  const navigationItems = [
    {
      href: `/teamarea?view=feed&group=${currentGroup}`,
      view: "feed",
      label: t("nav.feed"),
      shortLabel: "N",
    },
    {
      href: `/teamarea?view=saved&group=${currentGroup}`,
      view: "saved",
      label: t("nav.saved"),
      shortLabel: "S",
    },
    {
      href: `/teamarea?view=announcements&group=${currentGroup}`,
      view: "announcements",
      label: t("nav.announcements"),
      shortLabel: "A",
    },
  ] as const;

  const groups = [
    {
      href: `/teamarea?view=${currentView}&group=all-hands`,
      slug: "all-hands",
      label: t("groups.allHands"),
      shortLabel: "A",
    },
    {
      href: `/teamarea?view=${currentView}&group=design-team`,
      slug: "design-team",
      label: t("groups.designTeam"),
      shortLabel: "D",
    },
    {
      href: `/teamarea?view=${currentView}&group=operations`,
      slug: "operations",
      label: t("groups.operations"),
      shortLabel: "O",
    },
  ] as const;

  const isNavActive = (view: string) => pathname === teamareaBase && currentView === view;
  const isGroupActive = (slug: string) => pathname === teamareaBase && currentGroup === slug;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex h-full w-full flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)]/95 lg:h-full lg:w-[248px] lg:border-b-0 lg:border-r">
          <div className="h-full overflow-y-auto px-3 py-5">
            <div className="px-2 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                {t("navLabel")}
              </p>
            </div>

            <section className="space-y-1">
              <div className="px-2 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                  {t("sections.overview")}
                </p>
              </div>

              <nav className="space-y-1">
                {navigationItems.map((section) => {
                  const active = isNavActive(section.view);

                  return (
                    <Link
                      key={section.href}
                      href={section.href}
                      className={cn(
                        "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                        active
                          ? "bg-[var(--ak-bg-hover)] text-[var(--ak-accent)]"
                          : "text-[var(--ak-text-dim)] hover:bg-[var(--ak-bg-hover)] hover:text-[var(--ak-text-main)]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border text-[10px] font-semibold",
                          active
                            ? "border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-accent)]"
                            : "border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-[var(--ak-text-muted)]",
                        )}
                      >
                        {section.shortLabel}
                      </span>
                      <span className="truncate">{section.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </section>

            <section className="mt-5 space-y-1">
              <div className="px-2 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                  {t("sections.groups")}
                </p>
              </div>

              <nav className="space-y-1">
                {groups.map((group) => {
                  const active = isGroupActive(group.slug);

                  return (
                    <Link
                      key={group.slug}
                      href={group.href}
                      className={cn(
                        "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                        active
                          ? "bg-[var(--ak-bg-hover)] text-[var(--ak-text-main)]"
                          : "text-[var(--ak-text-dim)] hover:bg-[var(--ak-bg-hover)] hover:text-[var(--ak-text-main)]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border text-[10px] font-semibold",
                          active
                            ? "border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-accent)]"
                            : "border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-[var(--ak-text-muted)]",
                        )}
                      >
                        {group.shortLabel}
                      </span>
                      <span className="truncate">{group.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </section>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[#05070b]">
          <div className="mx-auto w-full max-w-5xl px-4 py-5 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
