import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTenantContext, type TenantRole } from "@arbeidskassen/supabase";
import { signOutAction, switchTenantAction } from "../../actions/auth";
import { AuthenticatedShell } from "../../(authenticated)/authenticated-shell";

function getUserInitial(email?: string | null): string {
  return email?.trim().charAt(0).toUpperCase() || "A";
}

function formatRole(role: TenantRole): string {
  switch (role) {
    case "owner":
      return "Eier";
    case "admin":
      return "Admin";
    case "member":
      return "Medlem";
    default:
      return "Lesetilgang";
  }
}

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await getTenantContext();

  if (!context?.user) {
    redirect("/login");
  }

  if (!context.currentTenant || context.requiresTenantSelection) {
    redirect("/select-tenant");
  }

  const tenantOptions = context.memberships.map((membership) => ({
    id: membership.tenant.id,
    label: membership.tenant.display_name ?? membership.tenant.name,
    secondaryLabel: `${formatRole(membership.role)} · ${membership.tenant.plan}`,
    isCurrent: membership.tenant.id === context.currentTenant?.id,
  }));

  return (
    <AuthenticatedShell
      orgName={context.currentTenant.display_name ?? context.currentTenant.name}
      tenantOptions={tenantOptions}
      userInitial={getUserInitial(context.user.email)}
      onTenantChange={switchTenantAction}
      onSignOut={signOutAction}
    >
      {children}
    </AuthenticatedShell>
  );
}
