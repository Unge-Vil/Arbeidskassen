import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DashboardOverlay, ThemeProvider } from "@arbeidskassen/ui";
import {
  getCurrentUserDashboardsSafe,
  getCurrentUserProfile,
} from "@arbeidskassen/supabase";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "@arbeidskassen/ui/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arbeidskassen",
  description: "Arbeidskassen Admin Panel",
};

export default async function RootLayout({
  children, params,
}: {
  children: React.ReactNode; params: Promise<{locale: string}>;
}) {
  const [{ locale }, messages, currentProfile] = await Promise.all([
    params,
    getMessages(),
    getCurrentUserProfile(),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider initialThemePreference={currentProfile?.profile.themePreference}>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          <DashboardOverlay fetchDashboards={getCurrentUserDashboardsSafe} />
        </ThemeProvider>
      </body>
    </html>
  );
}
