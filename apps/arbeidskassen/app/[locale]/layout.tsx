import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DashboardOverlay } from "@arbeidskassen/ui";
import "@arbeidskassen/ui/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arbeidskassen",
  description: "Arbeidskassen Admin Panel",
};

import { ThemeProvider } from "next-themes";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import { getDashboardsSafe } from "./actions/dashboard";

export default async function RootLayout({
  children, params,
}: {
  children: React.ReactNode; params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          <DashboardOverlay fetchDashboards={getDashboardsSafe} />
        </ThemeProvider>
      </body>
    </html>
  );
}
