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

/**
 * @deprecated Use CONSOLIDATED_AUTH_POLICY instead.
 * Kept for backward compatibility during the transition period.
 */
export const APP_AUTH_POLICIES = {
  arbeidskassen: CONSOLIDATED_AUTH_POLICY,
  backoffice: {
    loginPath: "/login",
    postLoginPath: "/",
    protectedPrefixes: ["/"],
  },
  bookdet: {
    loginPath: "/login",
    postLoginPath: "/",
    protectedPrefixes: ["/dashboard"],
  },
  organisasjon: {
    loginPath: "/login",
    postLoginPath: "/",
    protectedPrefixes: ["/"],
  },
  salesPortal: {
    loginPath: "/login",
    postLoginPath: "/",
    protectedPrefixes: ["/"],
  },
  teamarea: {
    loginPath: "/login",
    postLoginPath: "/",
    protectedPrefixes: ["/dashboard"],
  },
  today: {
    loginPath: "/login",
    postLoginPath: "/",
    protectedPrefixes: ["/dashboard"],
  },
} satisfies Record<string, Required<AppAuthMiddlewareOptions>>;

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
