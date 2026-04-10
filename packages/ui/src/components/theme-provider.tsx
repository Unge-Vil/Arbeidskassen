"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "night" | "system";
export type ResolvedTheme = "light" | "dark" | "night";

interface ThemeContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themePreference: "system",
  resolvedTheme: "light",
  setThemePreference: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme-preference") as ThemePreference;
    if (stored) setThemePreference(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme-preference", themePreference);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => {
      if (themePreference === "system") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedTheme(themePreference);
      }
    };
    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);
    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [themePreference]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "night");
    root.classList.add(resolvedTheme);
    root.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider
      value={{ themePreference, resolvedTheme, setThemePreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
