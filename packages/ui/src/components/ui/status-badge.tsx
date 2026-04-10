import * as React from "react";

import { cn } from "../../lib/utils";

type StatusVariant = "working" | "stuck" | "done" | "blank";

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  working: "bg-[var(--ak-status-working)] text-[#1e293b]",
  stuck: "bg-[var(--ak-status-stuck)] text-[#1e293b]",
  done: "bg-[var(--ak-status-done)] text-[#1e293b]",
  blank: "bg-[var(--ak-status-blank-bg)] text-[var(--ak-text-muted)]",
};

function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}

export { StatusBadge, type StatusBadgeProps, type StatusVariant };
