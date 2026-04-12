export const defaultDisabledModules = ["chat", "moodboard", "fastnotes"] as const

const supportedLocales = new Set(["no", "en"])

export function extractLocaleFromPathname(pathname?: string) {
  const segments = (pathname ?? "").split(/[?#]/, 1)[0].split("/").filter(Boolean)
  const matchedLocale = segments.find((segment) => supportedLocales.has(segment))

  return matchedLocale ?? "no"
}

export function resolveActiveAdminModule(pathname?: string) {
  const normalizedPath = (pathname ?? "").split(/[?#]/, 1)[0].toLowerCase()

  if (normalizedPath.includes("/today")) {
    return "today"
  }

  if (normalizedPath.includes("/bookdet")) {
    return "booking"
  }

  if (normalizedPath.includes("/teamarea") || normalizedPath.includes("/organisasjon")) {
    return "teamarea"
  }

  return "dashboard"
}

export function normalizeReturnTo(returnTo: string | null | undefined, locale = "no") {
  if (typeof returnTo !== "string") {
    return null
  }

  const trimmedReturnTo = returnTo.trim()

  if (!trimmedReturnTo || trimmedReturnTo.startsWith("//")) {
    return null
  }

  if (trimmedReturnTo.startsWith("http://") || trimmedReturnTo.startsWith("https://")) {
    try {
      const parsedUrl = new URL(trimmedReturnTo)

      if (!/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(parsedUrl.hostname)) {
        return null
      }

      return `${parsedUrl.origin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
    } catch {
      return null
    }
  }

  if (!trimmedReturnTo.startsWith("/")) {
    return null
  }

  const normalizedHref = resolveInternalAdminHref(trimmedReturnTo, locale)

  if (normalizedHref.startsWith("/")) {
    return normalizedHref
  }

  return null
}

function appendReturnTo(href: string, returnTo: string | null | undefined, locale: string) {
  const normalizedReturnTo = normalizeReturnTo(returnTo, locale)

  if (!normalizedReturnTo) {
    return href
  }

  const parsedHref = new URL(href, "http://arbeidskassen.local")
  parsedHref.searchParams.set("returnTo", normalizedReturnTo)

  return `${parsedHref.pathname}${parsedHref.search}${parsedHref.hash}`
}

export function buildArbeidskassenHref(
  locale: string,
  path = "/",
  options: { returnTo?: string | null } = {},
) {
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "/"

  if (normalizedPath === "/" || normalizedPath === "/login") {
    return appendReturnTo(normalizedPath, options.returnTo, locale)
  }

  return appendReturnTo(`/${locale}${normalizedPath}`, options.returnTo, locale)
}

export function buildLocalizedAppHref(base: string, locale: string, path = "") {
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : ""
  return `/${locale}${base}${normalizedPath}`
}

export function resolveAdminAppHrefs(locale: string) {
  return {
    dashboard: `/${locale}/dashboard`,
    today: `/${locale}/today`,
    booking: `/${locale}/bookdet`,
    organization: `/${locale}/organisasjon`,
    teamarea: `/${locale}/teamarea`,
    backoffice: `/${locale}/backoffice`,
    salesPortal: `/${locale}/sales-portal`,
  }
}

export function resolveInternalAdminHref(href: string, locale = "no") {
  if (
    !href ||
    /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(href) ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href
  }

  const parsedHref = new URL(href, "http://arbeidskassen.local")
  const segments = parsedHref.pathname.split("/").filter(Boolean)

  let resolvedLocale = supportedLocales.has(locale) ? locale : "no"
  if (segments[0] && supportedLocales.has(segments[0])) {
    resolvedLocale = segments.shift() ?? resolvedLocale
  }

  const [rootSegment, ...restSegments] = segments
  if (!rootSegment) {
    return href
  }

  let normalizedRestSegments = restSegments
  if (normalizedRestSegments[0] && supportedLocales.has(normalizedRestSegments[0])) {
    resolvedLocale = normalizedRestSegments[0]
    normalizedRestSegments = normalizedRestSegments.slice(1)
  }

  const appHrefs = resolveAdminAppHrefs(resolvedLocale)
  const baseHref = {
    dashboard: appHrefs.dashboard,
    today: appHrefs.today,
    bookdet: appHrefs.booking,
    organisasjon: appHrefs.organization,
    teamarea: appHrefs.teamarea,
    backoffice: appHrefs.backoffice,
    "sales-portal": appHrefs.salesPortal,
  }[rootSegment]

  if (!baseHref) {
    return href
  }

  const suffix = normalizedRestSegments.length > 0 ? `/${normalizedRestSegments.join("/")}` : ""
  return `${baseHref}${suffix}${parsedHref.search}${parsedHref.hash}`
}
