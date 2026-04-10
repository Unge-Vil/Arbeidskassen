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
  { href: "/", label: "Oversikt", icon: "🏠" },
  { href: "/virksomhet", label: "Virksomhet", icon: "🏢" },
  { href: "/brukere", label: "Brukere og roller", icon: "👥" },
  { href: "/struktur", label: "Struktur", icon: "🧭" },
  { href: "/fakturering", label: "Fakturering", icon: "💳" },
  { href: "/audit-logg", label: "Audit logg", icon: "🛡️" },
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
  const [activeModule, setActiveModule] = useState("dashboard");

  const isActive = (href: string) => {
    const localizedHref = href === "/" ? `/${locale}` : `/${locale}${href}`;
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

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8 lg:py-8">
          <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-72 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] shadow-sm">
              <div className="border-b border-[var(--ak-border-soft)] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">
                  Organisasjon
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--ak-text-main)]">
                  Innstillinger
                </h2>
                <p className="mt-1 text-sm text-[var(--ak-text-muted)]">
                  Alt følger samme tema, tokens og navigasjonsmønster som resten av Arbeidskassen.
                </p>
              </div>

              <nav className="space-y-1 p-2">
                {settingsSections.map((section) => {
                  const active = isActive(section.href);

                  return (
                    <Link
                      key={section.href}
                      href={section.href}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-[var(--ak-bg-main)] text-[var(--ak-text-main)] shadow-sm"
                          : "text-[var(--ak-text-muted)] hover:bg-[var(--ak-bg-hover)] hover:text-[var(--ak-text-main)]",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-xl border text-sm",
                            active
                              ? "border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)]"
                              : "border-transparent bg-[var(--ak-bg-main)]",
                          )}
                        >
                          <span aria-hidden>{section.icon}</span>
                        </span>
                        {section.label}
                      </span>
                      <span aria-hidden className="opacity-70">→</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
