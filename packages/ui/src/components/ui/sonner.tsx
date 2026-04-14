"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "../theme-provider"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={(theme === "night" ? "dark" : theme) as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--ak-bg-panel)] group-[.toaster]:text-[var(--ak-text-main)] group-[.toaster]:border-[var(--ak-border-soft)] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[var(--ak-text-muted)]",
          actionButton:
            "group-[.toast]:bg-[var(--ak-accent)] group-[.toast]:text-[var(--ak-accent-foreground)]",
          cancelButton:
            "group-[.toast]:bg-[var(--ak-bg-hover)] group-[.toast]:text-[var(--ak-text-muted)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
