import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@arbeidskassen/ui";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "@arbeidskassen/ui/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arbeidskassen Backoffice",
  description: "Platform administration — internal use only",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
