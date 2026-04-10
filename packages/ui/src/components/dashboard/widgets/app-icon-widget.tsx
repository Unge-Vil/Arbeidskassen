"use client";
import * as React from "react"

export interface AppIconWidgetProps {
  label: string
  iconUrl?: string
  href: string
}

export function AppIconWidget({ label, iconUrl, href }: AppIconWidgetProps) {
  return (
    <a 
      href={href}
      className="flex flex-col items-center justify-center h-full w-full bg-[var(--ak-bg-card)] rounded-xl hover:bg-[var(--ak-bg-hover)] transition-all duration-200 group group-hover:scale-105"
    >
      <div className="w-12 h-12 mb-3 rounded-2xl bg-[var(--ak-accent)] text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
        {iconUrl ? (
          <img src={iconUrl} alt={label} className="w-8 h-8 object-contain" />
        ) : (
          <span className="text-xl font-bold uppercase">{label.substring(0, 2)}</span>
        )}
      </div>
      <span className="text-sm font-medium text-[var(--ak-text-main)] max-w-[90%] truncate text-center">
        {label}
      </span>
    </a>
  )
}
