import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@arbeidskassen/ui/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BookDet",
  description: "BookDet - Bookingmodul",
};

import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';

export default async function RootLayout({
  children, params,
}: {
  children: React.ReactNode; params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}><NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider></body>
    </html>
  );
}
