import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { handleAppSession } from "@arbeidskassen/supabase/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const canonicalPublicPaths = new Set(["/", "/login"]);

export async function middleware(request: NextRequest) {
  const response = canonicalPublicPaths.has(request.nextUrl.pathname)
    ? NextResponse.next({ request })
    : intlMiddleware(request);

  return handleAppSession(
    request,
    {
      loginPath: "/login",
      postLoginPath: "/select-tenant",
      protectedPrefixes: ["/dashboard", "/select-tenant"],
    },
    response,
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
