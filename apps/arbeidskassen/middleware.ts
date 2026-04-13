import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { handleAppSession } from "@arbeidskassen/supabase/middleware";
import { routing } from "./i18n/routing";
import { checkRateLimit, type RateLimitConfig } from "./lib/rate-limit";

const intlMiddleware = createMiddleware(routing);
const canonicalPublicPaths = new Set(["/", "/login"]);

const authPolicy = {
  loginPath: "/login",
  postLoginPath: "/select-tenant",
  protectedPrefixes: [
    "/dashboard",
    "/select-tenant",
    "/profil",
    "/bookdet",
    "/organisasjon",
    "/teamarea",
    "/today",
    "/backoffice",
    "/sales-portal",
  ],
};

// Rate limit: 10 requests per 60 seconds per IP for sensitive routes
const authRateLimit: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 };
// Rate limit: 30 requests per 60 seconds per IP for webhooks
const webhookRateLimit: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

const rateLimitedPrefixes: Array<{ prefix: string; config: RateLimitConfig }> =
  [
    { prefix: "/login", config: authRateLimit },
    { prefix: "/select-tenant", config: authRateLimit },
    { prefix: "/api/webhooks/", config: webhookRateLimit },
  ];

function getRateLimitConfig(pathname: string): RateLimitConfig | null {
  for (const { prefix, config } of rateLimitedPrefixes) {
    if (pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith(prefix)) {
      return config;
    }
  }
  return null;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limiting on sensitive routes ─────────────────────────
  const rlConfig = getRateLimitConfig(pathname);
  if (rlConfig) {
    const ip = getClientIp(request);
    const key = `${ip}:${pathname}`;
    const result = checkRateLimit(key, rlConfig);

    if (!result.allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.retryAfterMs ?? 0) / 1000)),
        },
      });
    }
  }

  // ── Skip locale routing for API routes ───────────────────────
  // API routes handle their own response format — intlMiddleware
  // is only needed for page routes to do locale prefix detection.
  if (pathname.startsWith("/api/")) {
    return handleAppSession(request, authPolicy);
  }

  // ── Locale routing & auth for page routes ────────────────────
  const response = canonicalPublicPaths.has(pathname)
    ? NextResponse.next({ request })
    : intlMiddleware(request);

  // Expose pathname to Server Components via request header so that
  // i18n/request.ts can load only the relevant module namespace.
  response.headers.set("x-middleware-request-x-pathname", pathname);

  return handleAppSession(request, authPolicy, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
