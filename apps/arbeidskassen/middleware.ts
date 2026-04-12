import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import {
  APP_AUTH_POLICIES,
  defaultMiddlewareMatcher,
  handleAppSession,
} from "@arbeidskassen/supabase/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const canonicalPublicPaths = new Set(["/", "/login"]);

export async function middleware(request: NextRequest) {
  const response = canonicalPublicPaths.has(request.nextUrl.pathname)
    ? NextResponse.next({ request })
    : intlMiddleware(request);

  return handleAppSession(
    request,
    APP_AUTH_POLICIES.arbeidskassen,
    response,
  );
}

export const config = {
  matcher: defaultMiddlewareMatcher,
};
