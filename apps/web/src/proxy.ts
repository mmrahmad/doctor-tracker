import { SESSION_COOKIE_NAMES } from '@doctor-tracker/contracts';
import { NextResponse, type NextRequest } from 'next/server';

const SIGN_IN_PATH = '/login';

/**
 * Optimistic route guard: pages are only rendered for visitors holding a session cookie.
 * This is a UX gate, not the security boundary — every API call is authenticated and
 * authorized by the Express API, which verifies the token itself.
 */
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has(SESSION_COOKIE_NAMES.accessToken) || request.cookies.has(SESSION_COOKIE_NAMES.sessionHint);
  if (hasSession) return NextResponse.next();

  const signInUrl = new URL(SIGN_IN_PATH, request.url);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (requestedPath !== '/') signInUrl.searchParams.set('next', requestedPath);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  // Everything except the sign-in page, API rewrites, Next internals and static files.
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webp)$).*)'],
};
