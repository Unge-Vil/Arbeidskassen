"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";
import type { DashboardGrid as DashboardGridType } from "@arbeidskassen/ui";

const DashboardGrid = dynamic(
  () => import("@arbeidskassen/ui").then((m) => ({ default: m.DashboardGrid })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6">
        <div className="mb-6 h-7 w-48 animate-pulse rounded bg-[var(--ak-border)]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-[var(--ak-border)] bg-[var(--ak-bg-panel)]"
            />
          ))}
        </div>
      </div>
    ),
  },
);

export function DashboardGridClient(props: ComponentProps<typeof DashboardGridType>) {
  return <DashboardGrid {...props} />;
}
