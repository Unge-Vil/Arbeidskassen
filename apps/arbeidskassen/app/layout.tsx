import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider, Toaster, THEME_PREFERENCE_COOKIE } from "@arbeidskassen/ui";
import "@arbeidskassen/ui/globals.css";
import { cookies } from "next/headers";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

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
  const [cookieStore, locale, messages] = await Promise.all([
    cookies(),
    getLocale(),
    getMessages(),
  ]);
  const themeFromCookie = cookieStore.get(THEME_PREFERENCE_COOKIE)?.value;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider initialThemePreference={themeFromCookie as "light" | "dark" | "night" | "system" | undefined}>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
