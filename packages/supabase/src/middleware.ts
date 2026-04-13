import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveSupabaseEnv, SUPABASE_ENV_ERROR_MESSAGE } from "./env";

export type AppAuthMiddlewareOptions = {
  loginPath?: string;
  postLoginPath?: string;
  protectedPrefixes?: string[];
};

/**
 * Default auth policy for the consolidated single-app architecture.
 * All modules are route groups under (authenticated)/ in the main app.
 */
export const CONSOLIDATED_AUTH_POLICY: Required<AppAuthMiddlewareOptions> = {
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



type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function matchesPath(pathname: string, targetPath: string): boolean {
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

function isLocalDevelopmentHost(hostname: string) {
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(hostname);
}

function isPrefetchRequest(request: NextRequest): boolean {
  return (
    request.headers.get("purpose") === "prefetch" ||
    request.headers.has("next-router-prefetch")
  );
}

function isRscNavigationRequest(request: NextRequest): boolean {
  return request.headers.has("rsc") || request.headers.has("next-router-state-tree");
}

function buildLoginRedirectUrl(request: NextRequest, loginPath: string) {
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set(
    "returnTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return loginUrl;
}

function resolveSafeReturnTo(request: NextRequest) {
  const rawReturnTo = request.nextUrl.searchParams.get("returnTo");

  if (!rawReturnTo) {
    return null;
  }

  const trimmedReturnTo = rawReturnTo.trim();

  if (!trimmedReturnTo || trimmedReturnTo.startsWith("//")) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedReturnTo, request.url);
    const isSameOrigin = parsedUrl.origin === request.nextUrl.origin;

    if (!isSameOrigin && !isLocalDevelopmentHost(parsedUrl.hostname)) {
      return null;
    }

    if (isSameOrigin) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }

    return `${parsedUrl.origin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return null;
  }
}

export async function handleAppSession(
  request: NextRequest,
  {
    loginPath = "/login",
    postLoginPath = "/select-tenant",
    protectedPrefixes = ["/", "/dashboard", "/select-tenant"],
  }: AppAuthMiddlewareOptions = {},
  initialResponse?: NextResponse,
) {
  const response = initialResponse ?? NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const isLoginRoute = matchesPath(pathname, loginPath);
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : matchesPath(pathname, prefix),
  );

  // Skip auth round-trips for unrelated routes. Protected routes and login
  // still go through session checks.
  if (!isProtectedRoute && !isLoginRoute) {
    return response;
  }

  // Router prefetch requests should stay lightweight; server components will
  // still enforce auth and redirect when needed.
  if (isPrefetchRequest(request)) {
    return response;
  }

  // Client-side App Router transitions request RSC payloads. Those requests
  // are already protected by server components/layouts, so skipping the
  // middleware auth refresh avoids duplicate getUser() work per navigation.
  if (isProtectedRoute && isRscNavigationRequest(request)) {
    return response;
  }

  const { url: supabaseUrl, key: supabaseKey } = resolveSupabaseEnv();

  if (!supabaseUrl || !supabaseKey) {
    console.error(SUPABASE_ENV_ERROR_MESSAGE);

    if (!isLoginRoute && isProtectedRoute) {
      return NextResponse.redirect(buildLoginRedirectUrl(request, loginPath));
    }

    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;

  try {
    const {
      data: { user: resolvedUser },
    } = await supabase.auth.getUser();

    user = resolvedUser;
  } catch (error) {
    console.error("Supabase auth session refresh failed in middleware.", error);

    if (!isLoginRoute && isProtectedRoute) {
      return NextResponse.redirect(buildLoginRedirectUrl(request, loginPath));
    }
  }

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(buildLoginRedirectUrl(request, loginPath));
  }

  if (user && isLoginRoute) {
    const safeReturnTo = resolveSafeReturnTo(request);
    return NextResponse.redirect(new URL(safeReturnTo ?? postLoginPath, request.url));
  }

  return response;
}

export const defaultMiddlewareMatcher = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
];
