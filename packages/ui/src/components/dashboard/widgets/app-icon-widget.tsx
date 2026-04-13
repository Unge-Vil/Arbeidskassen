"use client";
import * as React from "react"

import { resolveInternalAdminHref } from "../../../lib/admin-links"

export interface AppIconWidgetProps {
  label: string
  iconUrl?: string
  href?: string
  disabled?: boolean
}

export function AppIconWidget({ label, iconUrl, href, disabled }: AppIconWidgetProps) {
  const resolvedHref = href ? resolveInternalAdminHref(href) : href
  const isDisabled = disabled || !resolvedHref || resolvedHref === "#"
  const content = (
    <>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ak-accent)] text-white shadow-sm transition-all group-hover:shadow-md">
        {iconUrl ? (
          <img src={iconUrl} alt={label} className="h-8 w-8 object-contain" />
        ) : (
          <span className="text-xl font-bold uppercase">{label.substring(0, 2)}</span>
        )}
      </div>
      <span className="max-w-[90%] truncate text-center text-sm font-medium text-[var(--ak-text-main)]">
        {label}
      </span>
    </>
  )

  if (isDisabled) {
    return (
      <div className="flex h-full w-full cursor-not-allowed flex-col items-center justify-center rounded-xl bg-[var(--ak-bg-card)] opacity-55">
        {content}
      </div>
    )
  }

  return (
    <a
      href={resolvedHref}
      className="group flex h-full w-full flex-col items-center justify-center rounded-xl bg-[var(--ak-bg-card)] transition-all duration-200 hover:bg-[var(--ak-bg-hover)] group-hover:scale-105"
    >
      {content}
    </a>
  )
}
