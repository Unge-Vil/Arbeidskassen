"use client";

import { useState, type ReactNode } from "react";
import { Navbar, cn, type TenantOption } from "@arbeidskassen/ui";
import { usePathname } from "next/navigation";
import { Link } from "../../i18n/routing";

type OrganizationShellProps = {
  children: ReactNode;
  locale: string;
  orgName: string;
  tenantOptions: TenantOption[];
  userInitial: string;
  profileHref: string;
  organizationHref: string;
  onTenantChange: (formData: FormData) => void | Promise<void>;
  onSignOut: (formData: FormData) => void | Promise<void>;
};

const settingsSections = [
  { href: "/virksomhet", label: "Virksomhet", shortLabel: "V" },
  { href: "/brukere", label: "Brukere", shortLabel: "B" },
  { href: "/struktur", label: "Struktur", shortLabel: "S" },
  { href: "/fakturering", label: "Fakturering", shortLabel: "F" },
  { href: "/audit-logg", label: "Audit logg", shortLabel: "A" },
] as const;

export function OrganizationShell({
  children,
  locale,
  orgName,
  tenantOptions,
  userInitial,
  profileHref,
  organizationHref,
  onTenantChange,
  onSignOut,
}: OrganizationShellProps) {
  const pathname = usePathname();
  const [activeModule, setActiveModule] = useState("teamarea");

  const isActive = (href: string) => {
    const localizedHref = `/${locale}${href}`;
    return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
  };

  return (
    <div className="flex h-screen w-full select-none flex-col overflow-hidden bg-[var(--ak-bg-main)] font-sans text-[var(--ak-text-main)] transition-colors duration-300">
      <Navbar
        workspaceName="Organisasjon"
        workspaceInitial="O"
        orgName={orgName}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        tenantOptions={tenantOptions}
        userInitial={userInitial}
        profileHref={profileHref}
        organizationHref={organizationHref}
        onTenantChange={onTenantChange}
        onSignOut={onSignOut}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex h-full w-full flex-col lg:flex-row">
          <aside className="w-full shrink-0 border-b border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] lg:h-full lg:w-[242px] lg:border-b-0 lg:border-r">
            <div className="h-full overflow-y-auto px-3 py-5">
              <div className="px-2 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                  Organisasjon
                </p>
              </div>

              <nav className="space-y-1">
                {settingsSections.map((section) => {
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
