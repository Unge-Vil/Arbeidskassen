import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import {
  APP_AUTH_POLICIES,
  defaultMiddlewareMatcher,
  handleAppSession,
} from "@arbeidskassen/supabase/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  return handleAppSession(
    request,
    APP_AUTH_POLICIES.today,
    intlResponse,
  );
}

export const config = {
  matcher: defaultMiddlewareMatcher,
};
