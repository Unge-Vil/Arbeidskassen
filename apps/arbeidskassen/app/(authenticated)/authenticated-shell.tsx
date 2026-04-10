"use client";

import { useState, type ReactNode } from "react";
import { Navbar, type TenantOption } from "@arbeidskassen/ui";

type AuthenticatedShellProps = {
  children: ReactNode;
  orgName: string;
  tenantOptions: TenantOption[];
  userInitial: string;
  profileHref: string;
  organizationHref: string;
  onTenantChange: (formData: FormData) => void | Promise<void>;
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
  onSignOut,
}: AuthenticatedShellProps) {
  const [activeModule, setActiveModule] = useState("dashboard");

  return (
      <div className="flex h-screen w-full select-none flex-col overflow-hidden bg-[var(--ak-bg-main)] font-sans text-[var(--ak-text-main)] transition-colors duration-300">
        <Navbar
          workspaceName="Arbeidskassen"
          workspaceInitial="A"
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
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
  );
}
