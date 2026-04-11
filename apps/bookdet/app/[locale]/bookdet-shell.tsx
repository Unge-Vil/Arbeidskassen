"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Navbar,
  cn,
  defaultDisabledModules,
  resolveActiveAdminModule,
  resolveAdminAppHrefs,
  type TenantOption,
} from "@arbeidskassen/ui";
import { Link } from "../../i18n/routing";

type BookdetShellProps = {
  children: ReactNode;
  locale: string;
  orgName: string;
  tenantOptions: TenantOption[];
  userInitial: string;
  profileHref: string;
  organizationHref: string;
  onTenantChange: (formData: FormData) => void | Promise<void>;
  onThemeChange?: (formData: FormData) => void | Promise<void>;
  onSignOut: (formData: FormData) => void | Promise<void>;
};

export function BookdetShell({
  children,
  locale,
  orgName,
  tenantOptions,
  userInitial,
  profileHref,
  organizationHref,
  onTenantChange,
  onThemeChange,
  onSignOut,
}: BookdetShellProps) {
  const pathname = usePathname();
  const t = useTranslations("bookdetShell");
  const activeModule = resolveActiveAdminModule(pathname);
  const moduleHrefs = useMemo(() => resolveAdminAppHrefs(locale), [locale]);

  const navigationGroups = [
    {
      title: t("sections.personal"),
      items: [
        { href: "/sok-book", label: t("nav.searchBook"), shortLabel: "S" },
        { href: "/mine-bookinger", label: t("nav.myBookings"), shortLabel: "M" },
      ],
    },
    {
      title: t("sections.admin"),
      items: [
        { href: "/bookinger", label: t("nav.bookings"), shortLabel: "B" },
        { href: "/ressurser", label: t("nav.resources"), shortLabel: "R" },
        { href: "/sjekklister", label: t("nav.checklists"), shortLabel: "S" },
        { href: "/innstillinger", label: t("nav.settings"), shortLabel: "I" },
      ],
    },
  ] as const;

  const isActive = (href: string) => {
    const localizedHref = `/${locale}${href}`;
    return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
  };

  return (
    <div className="flex h-screen w-full select-none flex-col overflow-hidden bg-[var(--ak-bg-main)] font-sans text-[var(--ak-text-main)] transition-colors duration-300">
      <Navbar
        workspaceName="BookDet"
        workspaceInitial="B"
        locale={locale}
        orgName={orgName}
        activeModule={activeModule}
        onModuleChange={() => undefined}
        moduleHrefs={{
          dashboard: moduleHrefs.dashboard,
          today: moduleHrefs.today,
          teamarea: moduleHrefs.teamarea,
          booking: moduleHrefs.booking,
        }}
        disabledModules={[...defaultDisabledModules]}
        tenantOptions={tenantOptions}
        userInitial={userInitial}
        profileHref={profileHref}
        organizationHref={organizationHref}
        onTenantChange={onTenantChange}
        onThemeChange={onThemeChange}
        onSignOut={onSignOut}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex h-full w-full flex-col lg:flex-row">
          <aside className="w-full shrink-0 border-b border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] lg:h-full lg:w-[242px] lg:border-b-0 lg:border-r">
            <div className="h-full overflow-y-auto px-3 py-5">
              <div className="px-2 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                  BookDet
                </p>
              </div>

              <div className="space-y-5">
                {navigationGroups.map((group) => (
                  <section key={group.title} className="space-y-1">
                    <div className="px-2 pb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                        {group.title}
                      </p>
                    </div>

                    <nav className="space-y-1">
                      {group.items.map((section) => {
                        const active = isActive(section.href);

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
                ))}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--ak-bg-main)]">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-8 lg:py-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
