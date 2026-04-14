"use client";

import React from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";

import {
  formatThemeCookieValue,
  normalizeResolvedTheme,
  normalizeThemePreference,
  resolveInitialThemePreference,
  THEME_PREFERENCE_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "./theme-utils";

interface ThemeContextValue {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  themePreference: "system",
  resolvedTheme: "light",
  setThemePreference: () => {},
});

function ThemeContextBridge({
  children,
  forcedTheme,
}: {
  children: React.ReactNode;
  forcedTheme?: ResolvedTheme;
}) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  const themePreference = normalizeThemePreference(forcedTheme ?? theme);
  const safeResolvedTheme = forcedTheme
    ? normalizeResolvedTheme(forcedTheme)
    : normalizeResolvedTheme(
        resolvedTheme,
        themePreference === "system" ? "light" : normalizeResolvedTheme(themePreference, "light"),
      );

  const setThemePreference = React.useCallback(
    (value: ThemePreference) => {
      setTheme(value);
    },
    [setTheme],
  );

  const value = React.useMemo(
    () => ({
      theme: themePreference,
      setTheme: setThemePreference,
      themePreference,
      resolvedTheme: safeResolvedTheme,
      setThemePreference,
    }),
    [safeResolvedTheme, setThemePreference, themePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Syncs the current theme to a cookie so the server can read it for SSR.
 * localStorage and cross-tab sync are handled natively by next-themes.
 */
function ThemeCookieSync({ forcedTheme }: { forcedTheme?: ResolvedTheme }) {
  const { theme } = useNextTheme();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const value = normalizeThemePreference(forcedTheme ?? theme);
    document.cookie = formatThemeCookieValue(value);
  }, [forcedTheme, theme]);

  return null;
}

export function useTheme() {
  return React.useContext(ThemeContext);
}

export type { ResolvedTheme, ThemePreference };

export function ThemeProvider({
  children,
  forcedTheme,
  initialThemePreference,
}: {
  children: React.ReactNode;
  forcedTheme?: ResolvedTheme;
  initialThemePreference?: ThemePreference;
}) {
  const defaultTheme = resolveInitialThemePreference({
    forcedTheme,
    profileThemePreference: initialThemePreference,
  });

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      disableTransitionOnChange
      enableSystem
      forcedTheme={forcedTheme}
      storageKey={THEME_PREFERENCE_STORAGE_KEY}
      themes={["light", "dark", "night"]}
    >
      <ThemeContextBridge forcedTheme={forcedTheme}>
        <ThemeCookieSync forcedTheme={forcedTheme} />
        {children}
      </ThemeContextBridge>
    </NextThemesProvider>
  );
}
