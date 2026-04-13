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
  it("returns locale-less internal paths for all modules", () => {
    expect(resolveAdminAppHrefs()).toMatchObject({
      dashboard: "/dashboard",
      today: "/today",
      booking: "/bookdet",
      organization: "/organisasjon",
      teamarea: "/teamarea",
      backoffice: "/backoffice",
      salesPortal: "/sales-portal",
    })
  })

  it("returns same paths regardless of locale argument", () => {
    expect(resolveAdminAppHrefs().booking).toBe("/bookdet")
  })

  it("keeps the public Arbeidskassen landing and login at the root", () => {
    expect(buildArbeidskassenHref("/")).toBe("/")
    expect(buildArbeidskassenHref("/login", { returnTo: "/bookdet/oversikt" })).toBe(
      "/login?returnTo=%2Fbookdet%2Foversikt",
    )
    expect(buildArbeidskassenHref("/dashboard")).toBe("/dashboard")
  })

  it("resolves internal admin hrefs to locale-less paths (strips stale locale prefix)", () => {
    expect(resolveInternalAdminHref("/bookdet")).toBe("/bookdet")
    expect(resolveInternalAdminHref("/bookdet/no")).toBe("/bookdet")
    expect(resolveInternalAdminHref("/no/backoffice")).toBe("/backoffice")
    expect(resolveInternalAdminHref("/sales-portal")).toBe("/sales-portal")
    expect(resolveInternalAdminHref("/organisasjon/en/roller")).toBe(
      "/organisasjon/roller",
    )
  })

  it("builds app hrefs with base and path (no locale prefix)", () => {
    expect(buildLocalizedAppHref("/organisasjon", "/roller")).toBe("/organisasjon/roller")
  })

  it("extracts a supported locale from direct values and stale nested paths", () => {
    expect(extractLocaleFromPathname("en")).toBe("en")
    expect(extractLocaleFromPathname("/bookdet/en/ressurser")).toBe("en")
    expect(extractLocaleFromPathname("/ukjent/sti")).toBe("no")
  })

  it("maps known admin paths back to the correct top-nav module", () => {
    expect(resolveActiveAdminModule("/dashboard")).toBe("dashboard")
    expect(resolveActiveAdminModule("/today/plan")).toBe("today")
    expect(resolveActiveAdminModule("/bookdet/ressurser")).toBe("booking")
    expect(resolveActiveAdminModule("/teamarea?view=feed")).toBe("teamarea")
    expect(resolveActiveAdminModule("/organisasjon/roller")).toBe("teamarea")
  })
})
