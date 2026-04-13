import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  getShellContext,
  getCurrentUserDashboardsSafe,
  type TenantRole,
} from "@arbeidskassen/supabase";
import { resolveAdminAppHrefs } from "@arbeidskassen/ui";
import { signOutAction, switchTenantAction } from "../actions/auth";
import { updateThemePreferenceAction } from "../actions/profile";
import { AuthenticatedShell } from "./authenticated-shell";
import { DashboardOverlayClient } from "./dashboard-overlay-client";

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

/**
 * AuthenticatedLayoutContent
 *
 * Async server component that owns the auth-context data fetching.
 * Lives inside a Suspense boundary in layout.tsx so the skeleton can be
 * flushed to the client immediately while getShellContext() is in-flight.
 */
export default async function AuthenticatedLayoutContent({
  children,
}: {
  children: ReactNode;
}) {
  const context = await getShellContext();
  const appHrefs = resolveAdminAppHrefs();

  if (!context?.user) {
    redirect(`/login?returnTo=${encodeURIComponent(appHrefs.dashboard)}`);
  }

  if (!context.currentTenant || context.requiresTenantSelection) {
    redirect(`/select-tenant?returnTo=${encodeURIComponent(appHrefs.dashboard)}`);
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
      profileHref="/profil"
      organizationHref={appHrefs.organization}
      onTenantChange={switchTenantAction}
      onThemeChange={updateThemePreferenceAction}
      onSignOut={signOutAction}
    >
      {children}
      <DashboardOverlayClient fetchDashboards={getCurrentUserDashboardsSafe} />
    </AuthenticatedShell>
  );
}
