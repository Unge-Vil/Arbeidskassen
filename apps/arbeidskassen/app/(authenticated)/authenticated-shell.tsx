"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Navbar,
  defaultDisabledModules,
  resolveActiveAdminModule,
  resolveAdminAppHrefs,
  type TenantOption,
} from "@arbeidskassen/ui";

type AuthenticatedShellProps = {
  children: ReactNode;
  orgName: string;
  tenantOptions: TenantOption[];
  userInitial: string;
  profileHref: string;
  organizationHref: string;
  onTenantChange: (formData: FormData) => void | Promise<void>;
  onThemeChange?: (formData: FormData) => void | Promise<void>;
  onSignOut: (formData: FormData) => void | Promise<void>;
};

export function AuthenticatedShell({
  children,
  orgName,
  tenantOptions,
  userInitial,
  profileHref,
  organizationHref,
  onTenantChange,
  onThemeChange,
  onSignOut,
}: AuthenticatedShellProps) {
  const pathname = usePathname();
  const activeModule = resolveActiveAdminModule(pathname);
  const locale = useLocale();
  const moduleHrefs = useMemo(() => resolveAdminAppHrefs(locale), [locale]);

  return (
    <div className="flex h-screen w-full select-none flex-col overflow-hidden bg-[var(--ak-bg-main)] font-sans text-[var(--ak-text-main)] transition-colors duration-300">
      <Navbar
        workspaceName="Arbeidskassen"
        workspaceInitial="A"
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
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
