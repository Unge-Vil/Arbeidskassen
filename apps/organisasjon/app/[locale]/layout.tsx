import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import {
  DashboardOverlay,
  ThemeProvider,
  buildArbeidskassenHref,
  resolveAdminAppHrefs,
} from "@arbeidskassen/ui";
import {
  getCurrentUserDashboardsSafe,
  getCurrentUserProfile,
  getTenantContext,
  updateCurrentUserThemePreference,
  type TenantRole,
} from "@arbeidskassen/supabase";
import "@arbeidskassen/ui/globals.css";

import { signOutAction, switchTenantAction } from "../actions/auth";
import { OrganizationShell } from "./organization-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Organisasjon",
  description: "Organisasjon — Organisasjonsadministrasjon",
};

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

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, messages, context, currentProfile] = await Promise.all([
    params,
    getMessages(),
    getTenantContext(),
    getCurrentUserProfile(),
  ]);
  const appHrefs = resolveAdminAppHrefs(locale);

  if (!context?.user) {
    redirect(buildArbeidskassenHref(locale, "/login", { returnTo: appHrefs.organization }));
  }

  if (!context.currentTenant || context.requiresTenantSelection) {
    redirect(buildArbeidskassenHref(locale, "/select-tenant", { returnTo: appHrefs.organization }));
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
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider initialThemePreference={currentProfile?.profile.themePreference}>
          <NextIntlClientProvider messages={messages}>
            <OrganizationShell
              locale={locale}
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
            </OrganizationShell>
          </NextIntlClientProvider>
          <DashboardOverlay fetchDashboards={getCurrentUserDashboardsSafe} />
        </ThemeProvider>
      </body>
    </html>
  );
}
