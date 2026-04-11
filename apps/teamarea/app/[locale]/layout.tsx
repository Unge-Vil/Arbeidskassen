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
import { TeamAreaShell } from "./teamarea-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TeamArea",
  description: "TeamArea — intern feed og organisasjonsoppdateringer i Arbeidskassen",
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
  const [{ locale }, messages] = await Promise.all([params, getMessages()]);
  const appHrefs = resolveAdminAppHrefs(locale);
  const hasSupabaseEnv = Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.SUPABASE_PUBLISHABLE_KEY ??
        process.env.SUPABASE_ANON_KEY),
  );

  const [context, currentProfile] = hasSupabaseEnv
    ? await Promise.all([getTenantContext(), getCurrentUserProfile()])
    : [null, null];

  if (hasSupabaseEnv && !context?.user) {
    redirect(buildArbeidskassenHref(locale, "/login", { returnTo: appHrefs.teamarea }));
  }

  if (hasSupabaseEnv && context && (!context.currentTenant || context.requiresTenantSelection)) {
    redirect(buildArbeidskassenHref(locale, "/select-tenant", { returnTo: appHrefs.teamarea }));
  }

  const tenantOptions = context?.memberships.map((membership) => ({
    id: membership.tenant.id,
    label: membership.tenant.display_name ?? membership.tenant.name,
    secondaryLabel: `${formatRole(membership.role)} · ${membership.tenant.plan}`,
    isCurrent: membership.tenant.id === context.currentTenant?.id,
  })) ?? [];

  const orgName = context?.currentTenant?.display_name ?? context?.currentTenant?.name ?? "TeamArea Preview";
  const userInitial = context?.user ? getUserInitial(context.user.email) : "T";

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
            <TeamAreaShell
              locale={locale}
              orgName={orgName}
              tenantOptions={tenantOptions}
              userInitial={userInitial}
              profileHref={buildArbeidskassenHref(locale, "/profil")}
              organizationHref={appHrefs.organization}
              onTenantChange={hasSupabaseEnv ? switchTenantAction : undefined}
              onThemeChange={hasSupabaseEnv ? updateThemePreferenceAction : undefined}
              onSignOut={hasSupabaseEnv ? signOutAction : undefined}
              isPreviewMode={!hasSupabaseEnv}
            >
              {children}
            </TeamAreaShell>
          </NextIntlClientProvider>
          {hasSupabaseEnv ? <DashboardOverlay fetchDashboards={getCurrentUserDashboardsSafe} /> : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
