"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";
import type { DashboardOverlay as DashboardOverlayType } from "@arbeidskassen/ui";

const DashboardOverlay = dynamic(
  () => import("@arbeidskassen/ui").then((m) => ({ default: m.DashboardOverlay })),
  { ssr: false },
);

export function DashboardOverlayClient(props: ComponentProps<typeof DashboardOverlayType>) {
  return <DashboardOverlay {...props} />;
}
