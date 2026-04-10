import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md border text-[13px] font-medium ring-offset-[var(--ak-bg-main)] transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] shadow-sm hover:bg-[var(--ak-accent-hover)] hover:shadow-md",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md",
        outline:
          "border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)] shadow-sm hover:bg-[var(--ak-bg-hover)] hover:text-[var(--ak-text-main)]",
        secondary:
          "border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] text-[var(--ak-text-main)] shadow-sm hover:bg-[var(--ak-bg-hover)]",
        ghost:
          "border-transparent bg-transparent text-[var(--ak-text-main)] hover:border-[var(--ak-border-soft)] hover:bg-[var(--ak-bg-hover)]",
        link: "border-transparent bg-transparent text-[var(--ak-accent)] underline-offset-4 hover:text-[var(--ak-accent-hover)] hover:underline",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3.5 py-2 text-[12px]",
        lg: "px-5 py-2.5",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
