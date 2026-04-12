import { redirect } from "next/navigation";

export default async function BookdetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/bookdet/oversikt`);
}
