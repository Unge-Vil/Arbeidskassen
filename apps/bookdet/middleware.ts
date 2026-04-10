import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { handleAppSession } from '@arbeidskassen/supabase/middleware';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  return handleAppSession(
    request,
    {
      loginPath: '/login',
      postLoginPath: '/',
      protectedPrefixes: ['/dashboard'],
    },
    intlResponse,
  );
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
