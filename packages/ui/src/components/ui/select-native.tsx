import * as React from "react";

import { cn } from "../../lib/utils";

const SelectNative = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex min-h-11 w-full rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-[14px] text-[var(--ak-text-main)] ring-offset-[var(--ak-bg-main)] transition-[border-color,box-shadow,background-color] hover:border-[var(--ak-border)] focus-visible:border-[var(--ak-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-ring)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--ak-status-stuck)] aria-[invalid=true]:text-[var(--ak-status-stuck)] aria-[invalid=true]:focus-visible:ring-[var(--ak-status-stuck)] motion-reduce:transition-none",
      className,
    )}
    {...props}
  />
));
SelectNative.displayName = "SelectNative";

export { SelectNative };
