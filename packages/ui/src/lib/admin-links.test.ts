import { describe, expect, it } from "vitest"

import {
  buildArbeidskassenHref,
  buildLocalizedAppHref,
  extractLocaleFromPathname,
  resolveActiveAdminModule,
  resolveAdminAppHrefs,
  resolveInternalAdminHref,
} from "./admin-links"

describe("admin-links", () => {
  it("returns internal paths for all modules", () => {
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

  it("returns english locale paths", () => {
    expect(resolveAdminAppHrefs("en").booking).toBe("/en/bookdet")
  })

  it("keeps the public Arbeidskassen landing and login at the root", () => {
    expect(buildArbeidskassenHref("no", "/")).toBe("/")
    expect(buildArbeidskassenHref("en", "/login", { returnTo: "/en/bookdet/oversikt" })).toBe(
      "/login?returnTo=%2Fen%2Fbookdet%2Foversikt",
    )
    expect(buildArbeidskassenHref("en", "/dashboard")).toBe("/en/dashboard")
  })

  it("resolves internal admin hrefs to localized paths", () => {
    expect(resolveInternalAdminHref("/bookdet", "no")).toBe("/no/bookdet")
    expect(resolveInternalAdminHref("/bookdet/no", "no")).toBe("/no/bookdet")
    expect(resolveInternalAdminHref("/no/backoffice", "no")).toBe("/no/backoffice")
    expect(resolveInternalAdminHref("/sales-portal", "en")).toBe("/en/sales-portal")
    expect(resolveInternalAdminHref("/organisasjon/en/roller", "no")).toBe(
      "/en/organisasjon/roller",
    )
  })

  it("builds localized app hrefs with base and path", () => {
    expect(buildLocalizedAppHref("/organisasjon", "no", "/roller")).toBe("/no/organisasjon/roller")
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
