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

function getOrganizationHref(locale: string): string {
  const configuredUrl =
    process.env.ORGANISASJON_APP_URL ??
    process.env.ORGANIZATION_APP_URL ??
    process.env.NEXT_PUBLIC_ORGANISASJON_URL ??
    process.env.NEXT_PUBLIC_ORGANIZATION_APP_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3002" : "/organisasjon");

  const trimmedUrl = configuredUrl.trim().replace(/\/$/, "");

  if (trimmedUrl.includes("{locale}")) {
    return trimmedUrl.replace("{locale}", locale);
  }

  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl.endsWith(`/${locale}`) ? trimmedUrl : `${trimmedUrl}/${locale}`;
  }

  return trimmedUrl || "/organisasjon";
}

export default async function AuthenticatedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, context] = await Promise.all([params, getTenantContext()]);

  if (!context?.user) {
    redirect(`/${locale}/login`);
  }

  if (!context.currentTenant || context.requiresTenantSelection) {
    redirect(`/${locale}/select-tenant`);
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
      profileHref={`/${locale}/profil`}
      organizationHref={getOrganizationHref(locale)}
      onTenantChange={switchTenantAction}
      onSignOut={signOutAction}
    >
      {children}
    </AuthenticatedShell>
  );
}
