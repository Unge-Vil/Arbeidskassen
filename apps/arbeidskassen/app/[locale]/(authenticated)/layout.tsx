import type { ReactNode } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getTenantContext,
  updateCurrentUserThemePreference,
  type TenantRole,
} from "@arbeidskassen/supabase";
import { buildArbeidskassenHref, resolveAdminAppHrefs } from "@arbeidskassen/ui";
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
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, context] = await Promise.all([params, getTenantContext()]);
  const appHrefs = resolveAdminAppHrefs(locale)

  if (!context?.user) {
    redirect(buildArbeidskassenHref(locale, "/login", { returnTo: appHrefs.dashboard }));
  }

  if (!context.currentTenant || context.requiresTenantSelection) {
    redirect(buildArbeidskassenHref(locale, "/select-tenant", { returnTo: appHrefs.dashboard }));
  }

  const tenantOptions = context.memberships.map((membership) => ({
    id: membership.tenant.id,
    label: membership.tenant.display_name ?? membership.tenant.name,
    secondaryLabel: `${formatRole(membership.role)} · ${membership.tenant.plan}`,
    isCurrent: membership.tenant.id === context.currentTenant?.id,
  }));

  async function updateThemePreferenceAction(formData: FormData) {
    "use server";

    const result = await updateCurrentUserThemePreference(formData.get("themePreference"));

    if (!result.success) {
      console.error("Failed to update theme preference", result.error);
    }

    revalidatePath("/", "layout");
  }

  return (
    <AuthenticatedShell
      orgName={context.currentTenant.display_name ?? context.currentTenant.name}
      tenantOptions={tenantOptions}
      userInitial={getUserInitial(context.user.email)}
      profileHref={buildArbeidskassenHref(locale, "/profil")}
      organizationHref={appHrefs.organization}
      onTenantChange={switchTenantAction}
      onThemeChange={updateThemePreferenceAction}
      onSignOut={signOutAction}
    >
      {children}
    </AuthenticatedShell>
  );
}
