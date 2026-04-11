import { afterEach, describe, expect, it } from "vitest"

import {
  buildArbeidskassenHref,
  buildLocalizedAppHref,
  extractLocaleFromPathname,
  resolveActiveAdminModule,
  resolveAdminAppHrefs,
  resolveInternalAdminHref,
} from "./admin-links"

describe("admin-links", () => {
  const env = process.env as Record<string, string | undefined>
  const originalNodeEnv = env.NODE_ENV
  const originalBookdetUrl = env.NEXT_PUBLIC_BOOKDET_APP_URL

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv
    if (typeof originalBookdetUrl === "undefined") {
      delete env.NEXT_PUBLIC_BOOKDET_APP_URL
    } else {
      env.NEXT_PUBLIC_BOOKDET_APP_URL = originalBookdetUrl
    }
  })

  it("adds locale to same-domain admin paths in production", () => {
    env.NODE_ENV = "production"
    delete env.NEXT_PUBLIC_BOOKDET_APP_URL

    expect(resolveAdminAppHrefs("no")).toMatchObject({
      dashboard: "/no/dashboard",
      today: "/no/today",
      booking: "/no/bookdet",
      organization: "/no/organisasjon",
      teamarea: "/no/teamarea",
      backoffice: "/no/backoffice",
      salesPortal: "/no/sales-portal",
    })
  })

  it("supports absolute app urls when configured", () => {
    env.NODE_ENV = "production"
    env.NEXT_PUBLIC_BOOKDET_APP_URL = "https://bookdet.example.com"

    expect(resolveAdminAppHrefs("en").booking).toBe("https://bookdet.example.com/en")
  })

  it("keeps the public Arbeidskassen landing and login at the root", () => {
    env.NODE_ENV = "production"

    expect(buildArbeidskassenHref("no", "/")).toBe("/")
    expect(buildArbeidskassenHref("en", "/login", { returnTo: "/en/bookdet/oversikt" })).toBe(
      "/login?returnTo=%2Fen%2Fbookdet%2Foversikt",
    )
    expect(buildArbeidskassenHref("en", "/dashboard")).toBe("/en/dashboard")
  })

  it("converts legacy same-domain shortcuts into working localhost app urls in dev", () => {
    env.NODE_ENV = "development"

    expect(resolveInternalAdminHref("/bookdet", "no")).toBe("http://localhost:3001/no")
    expect(resolveInternalAdminHref("/bookdet/no", "no")).toBe("http://localhost:3001/no")
    expect(resolveInternalAdminHref("/no/backoffice", "no")).toBe("http://localhost:3099/no")
    expect(resolveInternalAdminHref("/sales-portal", "en")).toBe("http://localhost:3003/en")
    expect(resolveInternalAdminHref("/organisasjon/en/roller", "no")).toBe(
      "http://localhost:3002/en/roller",
    )
  })

  it("replaces {locale} placeholders and preserves nested paths", () => {
    expect(buildLocalizedAppHref("/organisasjon/{locale}", "no", "/roller")).toBe("/organisasjon/no/roller")
  })

  it("extracts a supported locale from direct values and stale nested paths", () => {
    expect(extractLocaleFromPathname("en")).toBe("en")
    expect(extractLocaleFromPathname("/bookdet/en/ressurser")).toBe("en")
    expect(extractLocaleFromPathname("/ukjent/sti")).toBe("no")
  })

  it("maps known admin paths back to the correct top-nav module", () => {
    expect(resolveActiveAdminModule("/no/dashboard")).toBe("dashboard")
    expect(resolveActiveAdminModule("/en/today/plan")).toBe("today")
    expect(resolveActiveAdminModule("/no/bookdet/ressurser")).toBe("booking")
    expect(resolveActiveAdminModule("/no/teamarea?view=feed")).toBe("teamarea")
    expect(resolveActiveAdminModule("/no/organisasjon/roller")).toBe("teamarea")
  })
})
