import { Suspense } from "react";
import type { Metadata } from "next";
import { TeamAreaShell } from "./teamarea-shell";
import TeamAreaLoading from "./loading";

export const metadata: Metadata = {
  title: "TeamArea",
  description: "TeamArea — intern feed i Arbeidskassen",
};

export default function TeamareaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<TeamAreaLoading />}>
      <TeamAreaShell>{children}</TeamAreaShell>
    </Suspense>
  );
}
