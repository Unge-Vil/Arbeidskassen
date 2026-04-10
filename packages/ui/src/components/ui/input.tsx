import * as React from "react"

import { cn } from "../../lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-11 w-full rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-[13px] text-[var(--ak-text-main)] shadow-sm ring-offset-[var(--ak-bg-main)] transition-[border-color,box-shadow,background-color] file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-[var(--ak-text-main)] placeholder:text-[var(--ak-text-muted)] focus-visible:border-[var(--ak-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-ring)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
