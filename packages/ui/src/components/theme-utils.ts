export type ThemePreference = "light" | "dark" | "night" | "system"
export type ResolvedTheme = "light" | "dark" | "night"

export const THEME_PREFERENCE_STORAGE_KEY = "theme-preference"
export const THEME_PREFERENCE_COOKIE = "ak-theme-preference"

export function normalizeThemePreference(
  value: unknown,
  fallback: ThemePreference = "system",
): ThemePreference {
  if (value === "light" || value === "dark" || value === "night" || value === "system") {
    return value
  }

  return fallback
}

export function normalizeResolvedTheme(
  value: unknown,
  fallback: ResolvedTheme = "light",
): ResolvedTheme {
  if (value === "light" || value === "dark" || value === "night") {
    return value
  }

  return fallback
}

export function resolveInitialThemePreference({
  forcedTheme,
  profileThemePreference,
  cookieThemePreference,
  storageThemePreference,
}: {
  forcedTheme?: ResolvedTheme | null
  profileThemePreference?: ThemePreference | null
  cookieThemePreference?: string | null
  storageThemePreference?: string | null
}): ThemePreference {
  if (forcedTheme) {
    return normalizeThemePreference(forcedTheme, "light")
  }

  if (profileThemePreference) {
    return normalizeThemePreference(profileThemePreference)
  }

  if (cookieThemePreference) {
    return normalizeThemePreference(cookieThemePreference)
  }

  if (storageThemePreference) {
    return normalizeThemePreference(storageThemePreference)
  }

  return "system"
}

export function parseThemePreferenceCookie(cookieHeader: string | null | undefined) {
  if (!cookieHeader) {
    return undefined
  }

  const cookie = cookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith(`${THEME_PREFERENCE_COOKIE}=`))

  if (!cookie) {
    return undefined
  }

  const rawValue = cookie.slice(`${THEME_PREFERENCE_COOKIE}=`.length)
  const normalizedValue = normalizeThemePreference(rawValue, "system")

  return rawValue === normalizedValue ? normalizedValue : undefined
}

export function formatThemeCookieValue(themePreference: ThemePreference) {
  return `${THEME_PREFERENCE_COOKIE}=${themePreference}; Path=/; Max-Age=31536000; SameSite=Lax`
}
