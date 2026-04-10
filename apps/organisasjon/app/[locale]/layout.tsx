import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@arbeidskassen/ui";
import { getTenantContext, type TenantRole } from "@arbeidskassen/supabase";
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

function getArbeidskassenHref(locale: string, path: string): string {
  const configuredBase =
    process.env.ARBEIDSKASSEN_APP_URL ??
    process.env.WEB_APP_URL ??
    process.env.NEXT_PUBLIC_WEB_APP_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const trimmedBase = configuredBase.trim().replace(/\/$/, "");

  if (!trimmedBase) {
    return `/${locale}${normalizedPath}`;
  }

  return `${trimmedBase}/${locale}${normalizedPath}`;
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, messages, context] = await Promise.all([
    params,
    getMessages(),
    getTenantContext(),
  ]);

  if (!context?.user) {
    redirect(getArbeidskassenHref(locale, "/login"));
  }

  if (!context.currentTenant || context.requiresTenantSelection) {
    redirect(getArbeidskassenHref(locale, "/select-tenant"));
  }

  const tenantOptions = context.memberships.map((membership) => ({
    id: membership.tenant.id,
    label: membership.tenant.display_name ?? membership.tenant.name,
    secondaryLabel: `${formatRole(membership.role)} · ${membership.tenant.plan}`,
    isCurrent: membership.tenant.id === context.currentTenant?.id,
  }));

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <OrganizationShell
              locale={locale}
              orgName={context.currentTenant.display_name ?? context.currentTenant.name}
              tenantOptions={tenantOptions}
              userInitial={getUserInitial(context.user.email)}
              profileHref={getArbeidskassenHref(locale, "/profil")}
              organizationHref={`/${locale}`}
              onTenantChange={switchTenantAction}
              onSignOut={signOutAction}
            >
              {children}
            </OrganizationShell>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
