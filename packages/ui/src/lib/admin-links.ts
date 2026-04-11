export const defaultDisabledModules = ["chat", "moodboard", "fastnotes"] as const

const supportedLocales = new Set(["no", "en"])

type EnvMap = Record<string, string | undefined>

function getEnv(): EnvMap {
  return (globalThis as { process?: { env?: EnvMap } }).process?.env ?? {}
}

function isDevelopmentRuntime() {
  if (getEnv().NODE_ENV === "development") {
    return true
  }

  if (typeof window !== "undefined") {
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname)
  }

  return false
}

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

function pickConfiguredBase(
  candidates: Array<string | undefined>,
  devFallback: string,
  prodFallback: string,
) {
  const configuredBase = candidates.find((value) => typeof value === "string" && value.trim().length > 0)

  if (configuredBase) {
    return configuredBase.trim().replace(/\/$/, "")
  }

  return isDevelopmentRuntime() ? devFallback : prodFallback
}

function isAbsoluteHttpHref(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
}

function isLocalDevelopmentHost(hostname: string) {
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(hostname)
}

export function normalizeReturnTo(returnTo: string | null | undefined, locale = "no") {
  if (typeof returnTo !== "string") {
    return null
  }

  const trimmedReturnTo = returnTo.trim()

  if (!trimmedReturnTo || trimmedReturnTo.startsWith("//")) {
    return null
  }

  if (isAbsoluteHttpHref(trimmedReturnTo)) {
    try {
      const parsedUrl = new URL(trimmedReturnTo)

      if (!isLocalDevelopmentHost(parsedUrl.hostname)) {
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

  if (normalizedHref.startsWith("/") || isAbsoluteHttpHref(normalizedHref)) {
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

  if (isAbsoluteHttpHref(href)) {
    return `${parsedHref.origin}${parsedHref.pathname}${parsedHref.search}${parsedHref.hash}`
  }

  return `${parsedHref.pathname}${parsedHref.search}${parsedHref.hash}`
}

export function buildArbeidskassenHref(
  locale: string,
  path = "/",
  options: { returnTo?: string | null } = {},
) {
  const env = getEnv()
  const configuredBase = pickConfiguredBase(
    [env.ARBEIDSKASSEN_APP_URL, env.WEB_APP_URL, env.NEXT_PUBLIC_WEB_APP_URL],
    "http://localhost:3000",
    "",
  )
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "/"
  const trimmedBase = configuredBase.trim().replace(/\/$/, "")

  if (!trimmedBase) {
    if (normalizedPath === "/" || normalizedPath === "/login") {
      return appendReturnTo(normalizedPath, options.returnTo, locale)
    }

    return appendReturnTo(buildLocalizedAppHref("", locale, normalizedPath), options.returnTo, locale)
  }

  if (isAbsoluteHttpHref(trimmedBase)) {
    if (normalizedPath === "/") {
      return appendReturnTo(trimmedBase, options.returnTo, locale)
    }

    if (normalizedPath === "/login") {
      return appendReturnTo(`${trimmedBase}/login`, options.returnTo, locale)
    }

    return appendReturnTo(buildLocalizedAppHref(trimmedBase, locale, normalizedPath), options.returnTo, locale)
  }

  const normalizedBase = trimmedBase.startsWith("/") ? trimmedBase : `/${trimmedBase}`

  if (normalizedPath === "/") {
    return appendReturnTo(normalizedBase, options.returnTo, locale)
  }

  if (normalizedPath === "/login") {
    return appendReturnTo(`${normalizedBase}/login`, options.returnTo, locale)
  }

  return appendReturnTo(buildLocalizedAppHref(normalizedBase, locale, normalizedPath), options.returnTo, locale)
}

export function buildLocalizedAppHref(base: string, locale: string, path = "") {
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : ""
  const trimmedBase = base.trim().replace(/\/$/, "")

  if (!trimmedBase) {
    return `/${locale}${normalizedPath}`
  }

  if (trimmedBase.includes("{locale}")) {
    return `${trimmedBase.replace("{locale}", locale)}${normalizedPath}`
  }

  if (trimmedBase.startsWith("http://") || trimmedBase.startsWith("https://")) {
    const localizedBase = trimmedBase.endsWith(`/${locale}`) ? trimmedBase : `${trimmedBase}/${locale}`
    return `${localizedBase}${normalizedPath}`
  }

  const normalizedBase = trimmedBase.startsWith("/") ? trimmedBase : `/${trimmedBase}`
  const localizedBase =
    normalizedBase === `/${locale}` || normalizedBase.startsWith(`/${locale}/`)
      ? normalizedBase
      : `/${locale}${normalizedBase}`

  return `${localizedBase}${normalizedPath}`
}

export function resolveAdminAppHrefs(locale: string) {
  const env = getEnv()

  const todayBase = pickConfiguredBase(
    [env.TODAY_APP_URL, env.NEXT_PUBLIC_TODAY_APP_URL],
    "http://localhost:3004",
    "/today",
  )

  const bookingBase = pickConfiguredBase(
    [env.BOOKDET_APP_URL, env.NEXT_PUBLIC_BOOKDET_APP_URL],
    "http://localhost:3001",
    "/bookdet",
  )

  const organizationBase = pickConfiguredBase(
    [
      env.ORGANISASJON_APP_URL,
      env.ORGANIZATION_APP_URL,
      env.NEXT_PUBLIC_ORGANISASJON_URL,
      env.NEXT_PUBLIC_ORGANIZATION_APP_URL,
    ],
    "http://localhost:3002",
    "/organisasjon",
  )

  const teamareaBase = pickConfiguredBase(
    [env.TEAMAREA_APP_URL, env.NEXT_PUBLIC_TEAMAREA_APP_URL],
    "http://localhost:3005",
    "/teamarea",
  )

  const backofficeBase = pickConfiguredBase(
    [env.BACKOFFICE_APP_URL, env.NEXT_PUBLIC_BACKOFFICE_APP_URL],
    "http://localhost:3099",
    "/backoffice",
  )

  const salesPortalBase = pickConfiguredBase(
    [env.SALES_PORTAL_APP_URL, env.NEXT_PUBLIC_SALES_PORTAL_APP_URL],
    "http://localhost:3003",
    "/sales-portal",
  )

  return {
    dashboard: buildArbeidskassenHref(locale, "/dashboard"),
    today: buildLocalizedAppHref(todayBase, locale),
    booking: buildLocalizedAppHref(bookingBase, locale),
    organization: buildLocalizedAppHref(organizationBase, locale),
    teamarea: buildLocalizedAppHref(teamareaBase, locale),
    backoffice: buildLocalizedAppHref(backofficeBase, locale),
    salesPortal: buildLocalizedAppHref(salesPortalBase, locale),
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
