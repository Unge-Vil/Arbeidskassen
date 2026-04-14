"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import type { ThemePreference } from "./theme-utils";

const cycle: ThemePreference[] = ["light", "dark", "system"];

export function ThemeToggle({ className }: { className?: string }) {
  const { themePreference, setThemePreference } = useTheme();

  const next = () => {
    const idx = cycle.indexOf(themePreference);
    setThemePreference(cycle[(idx + 1) % cycle.length]!);
  };

  const Icon =
    themePreference === "dark" || themePreference === "night"
      ? Moon
      : themePreference === "system"
        ? Monitor
        : Sun;

  return (
    <button
      type="button"
      onClick={next}
      aria-label="Bytt tema"
      className={
        className ??
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-muted)] transition-colors hover:bg-[var(--ak-bg-hover)] hover:text-[var(--ak-text-main)]"
      }
    >
      <Icon size={16} />
    </button>
  );
}
