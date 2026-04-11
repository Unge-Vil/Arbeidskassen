import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DashboardOverlay, ThemeProvider } from "@arbeidskassen/ui";
import {
  getCurrentUserDashboardsSafe,
  getCurrentUserProfile,
} from "@arbeidskassen/supabase";
import "@arbeidskassen/ui/globals.css";

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
  const currentProfile = await getCurrentUserProfile();

  return (
    <html lang="no" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider initialThemePreference={currentProfile?.profile.themePreference}>
          {children}
          <DashboardOverlay fetchDashboards={getCurrentUserDashboardsSafe} />
        </ThemeProvider>
      </body>
    </html>
  );
}
