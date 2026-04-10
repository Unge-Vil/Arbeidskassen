"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface MetricWidgetProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  subtitle?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

const toneClasses: Record<NonNullable<MetricWidgetProps["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
};

export function MetricWidget({
  label,
  value,
  unit,
  trend,
  subtitle,
  tone = "neutral",
}: MetricWidgetProps) {
  const isPositive = trend?.trim().startsWith("+");
  const isNegative = trend?.trim().startsWith("-");

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ak-text-muted)]">
            {label}
          </p>
          {subtitle ? (
            <p className="mt-1 text-xs text-[var(--ak-text-muted)]">{subtitle}</p>
          ) : null}
        </div>

        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
              toneClasses[tone],
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : isNegative ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            {trend}
          </span>
        ) : null}
      </div>

      <div className="mt-6 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-tight text-[var(--ak-text-main)]">
          {value}
        </span>
        {unit ? <span className="pb-1 text-sm text-[var(--ak-text-muted)]">{unit}</span> : null}
      </div>
    </div>
  );
}
