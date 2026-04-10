import { describe, expect, it } from "vitest"

import {
  formatThemeCookieValue,
  normalizeThemePreference,
  parseThemePreferenceCookie,
  resolveInitialThemePreference,
} from "./theme-utils"

describe("theme utils", () => {
  it("normalizes invalid values back to system", () => {
    expect(normalizeThemePreference("dark")).toBe("dark")
    expect(normalizeThemePreference("night")).toBe("night")
    expect(normalizeThemePreference("sepia")).toBe("system")
    expect(normalizeThemePreference(undefined)).toBe("system")
  })

  it("prefers forced or profile preferences before cookie/storage fallbacks", () => {
    expect(
      resolveInitialThemePreference({
        forcedTheme: "light",
        profileThemePreference: "night",
        cookieThemePreference: "dark",
        storageThemePreference: "system",
      }),
    ).toBe("light")

    expect(
      resolveInitialThemePreference({
        profileThemePreference: "night",
        cookieThemePreference: "dark",
        storageThemePreference: "light",
      }),
    ).toBe("night")

    expect(
      resolveInitialThemePreference({
        cookieThemePreference: "dark",
        storageThemePreference: "light",
      }),
    ).toBe("dark")
  })

  it("round-trips the cookie format safely", () => {
    const serialized = formatThemeCookieValue("night")

    expect(serialized).toContain("ak-theme-preference=night")
    expect(parseThemePreferenceCookie(`foo=bar; ${serialized}`)).toBe("night")
    expect(parseThemePreferenceCookie("foo=bar")).toBeUndefined()
  })
})
