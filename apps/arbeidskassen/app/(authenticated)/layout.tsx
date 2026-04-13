import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import {
  getShellContext,
  getCurrentUserDashboardsSafe,
  type TenantRole,
} from "@arbeidskassen/supabase";
import { resolveAdminAppHrefs } from "@arbeidskassen/ui";
import { signOutAction, switchTenantAction } from "../actions/auth";
import { updateThemePreferenceAction } from "../actions/profile";
import { AuthenticatedShell } from "./authenticated-shell";

const DashboardOverlay = dynamic(
  () => import("@arbeidskassen/ui").then((m) => ({ default: m.DashboardOverlay })),
  { ssr: false },
);

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
  const [locale, context] = await Promise.all([getLocale(), getShellContext()]);
  const appHrefs = resolveAdminAppHrefs(locale);

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
      <DashboardOverlay fetchDashboards={getCurrentUserDashboardsSafe} />
    </AuthenticatedShell>
  );
}
