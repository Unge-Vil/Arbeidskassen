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
  parseThemePreferenceCookie,
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

function ThemePreferenceSync({
  forcedTheme,
  initialThemePreference,
}: {
  forcedTheme?: ResolvedTheme;
  initialThemePreference?: ThemePreference;
}) {
  const { theme, setTheme } = useNextTheme();

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const preferredTheme = resolveInitialThemePreference({
      forcedTheme,
      profileThemePreference: initialThemePreference,
      cookieThemePreference: parseThemePreferenceCookie(document.cookie),
      storageThemePreference: window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY),
    });

    if (theme !== preferredTheme) {
      setTheme(preferredTheme);
    }
  }, [forcedTheme, initialThemePreference, setTheme]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextTheme = normalizeThemePreference(forcedTheme ?? theme);

    window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextTheme);
    document.cookie = formatThemeCookieValue(nextTheme);
  }, [forcedTheme, theme]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_PREFERENCE_STORAGE_KEY || !event.newValue) {
        return;
      }

      const nextTheme = normalizeThemePreference(event.newValue);

      if (theme !== nextTheme) {
        setTheme(nextTheme);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [setTheme, theme]);

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
        <ThemePreferenceSync
          forcedTheme={forcedTheme}
          initialThemePreference={initialThemePreference}
        />
        {children}
      </ThemeContextBridge>
    </NextThemesProvider>
  );
}
