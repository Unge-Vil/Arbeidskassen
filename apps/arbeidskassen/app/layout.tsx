import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DashboardOverlay, ThemeProvider, Toaster } from "@arbeidskassen/ui";
import {
  getCurrentUserDashboardsSafe,
  getCurrentUserProfile,
} from "@arbeidskassen/supabase";
import { getLocale } from "next-intl/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arbeidskassen",
  description: "Arbeidskassen Admin Panel",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentProfile, locale] = await Promise.all([
    getCurrentUserProfile(),
    getLocale(),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider initialThemePreference={currentProfile?.profile.themePreference}>
          {children}
          <Toaster />
          <DashboardOverlay fetchDashboards={getCurrentUserDashboardsSafe} />
        </ThemeProvider>
      </body>
    </html>
  );
}
