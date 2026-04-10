import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveSupabaseEnv, SUPABASE_ENV_ERROR_MESSAGE } from "./env";

export type AppAuthMiddlewareOptions = {
  loginPath?: string;
  postLoginPath?: string;
  protectedPrefixes?: string[];
};

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function matchesPath(pathname: string, targetPath: string): boolean {
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
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
      return NextResponse.redirect(new URL(loginPath, request.url));
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
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  }

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL(postLoginPath, request.url));
  }

  return response;
}

export const defaultMiddlewareMatcher = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
];
