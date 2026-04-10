import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  let response = initialResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          const updatedResponse = NextResponse.next({ request });

          response.headers.forEach((value, key) => {
            updatedResponse.headers.set(key, value);
          });

          response = updatedResponse;

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = matchesPath(pathname, loginPath);
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : matchesPath(pathname, prefix),
  );

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
