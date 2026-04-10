"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";

export interface StatusListItem {
  label: string;
  value: string | number;
  detail?: string;
  status?: "ok" | "warning" | "critical" | "neutral";
}

export interface StatusListWidgetProps {
  title?: string;
  items?: StatusListItem[];
}

const defaultItems: StatusListItem[] = [
  { label: "Åpne saker", value: 4, detail: "2 haster", status: "warning" },
  { label: "Team online", value: 7, detail: "3 i møte", status: "ok" },
  { label: "Feil i sync", value: 1, detail: "Må sjekkes", status: "critical" },
];

const dotClasses: Record<NonNullable<StatusListItem["status"]>, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-rose-500",
  neutral: "bg-slate-400",
};

export function StatusListWidget({
  title = "Nåstatus",
  items = defaultItems,
}: StatusListWidgetProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[var(--ak-text-main)]">{title}</p>
        <p className="text-xs text-[var(--ak-text-muted)]">Oversikt over det viktigste akkurat nå</p>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 rounded-full",
                      dotClasses[item.status ?? "neutral"],
                    )}
                  />
                  <p className="truncate text-sm font-medium text-[var(--ak-text-main)]">{item.label}</p>
                </div>
                {item.detail ? (
                  <p className="mt-1 text-xs text-[var(--ak-text-muted)]">{item.detail}</p>
                ) : null}
              </div>

              <span className="text-sm font-semibold text-[var(--ak-text-main)]">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
