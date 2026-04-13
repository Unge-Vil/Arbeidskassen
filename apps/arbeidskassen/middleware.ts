import { NextResponse, type NextRequest } from "next/server";
import { handleAppSession } from "@arbeidskassen/supabase/middleware";
import { checkRateLimit, type RateLimitConfig } from "./lib/rate-limit";

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

  // ── Page routes: forward pathname header + auth ──────────────
  // Locale is resolved from cookie/Accept-Language in i18n/request.ts.
  // No intlMiddleware rewrite needed since routes have no [locale] segment.
  const response = NextResponse.next({ request });

  // Expose pathname to Server Components via request header so that
  // i18n/request.ts can load only the relevant module namespace.
  if (!pathname.startsWith("/api/")) {
    response.headers.set("x-pathname", pathname);
  }

  return handleAppSession(request, authPolicy, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
