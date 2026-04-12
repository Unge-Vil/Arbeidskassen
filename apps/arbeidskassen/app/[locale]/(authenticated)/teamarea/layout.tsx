import type { Metadata } from "next";
import { TeamAreaShell } from "./teamarea-shell";

export const metadata: Metadata = {
  title: "TeamArea",
  description: "TeamArea — intern feed i Arbeidskassen",
};

export default function TeamareaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TeamAreaShell>{children}</TeamAreaShell>;
}
