import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)]",
        secondary: "border-[var(--ak-border-soft)] bg-[var(--ak-bg-hover)] text-[var(--ak-text-main)]",
        destructive: "border-transparent bg-[var(--ak-status-stuck)] text-[#1e293b]",
        outline: "border-[var(--ak-border-soft)] bg-transparent text-[var(--ak-text-muted)]",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
)

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
