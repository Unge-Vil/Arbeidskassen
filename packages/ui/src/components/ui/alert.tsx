import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-[var(--ak-bg-main)] text-[var(--ak-text-main)] border-[var(--ak-border-soft)]",
        destructive:
          "border-[var(--ak-status-stuck)]/50 text-[var(--ak-status-stuck)] dark:border-[var(--ak-status-stuck)] [&>svg]:text-[var(--ak-status-stuck)] bg-[var(--ak-status-stuck-bg)]",
        success:
          "border-[var(--ak-status-done)]/50 text-[var(--ak-status-done)] dark:border-[var(--ak-status-done)] [&>svg]:text-[var(--ak-status-done)] bg-[var(--ak-status-done-bg)]",
        warning:
          "border-[var(--ak-status-working)]/50 text-[var(--ak-status-working)] dark:border-[var(--ak-status-working)] [&>svg]:text-[var(--ak-status-working)] bg-[var(--ak-status-working-bg)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }