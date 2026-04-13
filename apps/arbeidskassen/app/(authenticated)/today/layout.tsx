import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today",
  description: "Today — dagsoversikt i Arbeidskassen",
};

export default function TodayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
