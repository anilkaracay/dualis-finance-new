import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware — route protection.
 *
 * Public paths (landing, auth, static) are always allowed.
 * All other paths require the `dualis-auth-token` cookie
 * (set by useAuthStore on login) to be present.
 */

const PUBLIC_PREFIXES = [
  '/auth',
  '/api',
  '/_next',
  '/images',
  '/favicon',
  '/docs',
];

const PUBLIC_EXACT = new Set(['/', '/manifest.json', '/robots.txt', '/sitemap.xml']);

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authToken = request.cookies.get('dualis-auth-token');
  if (authToken?.value) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to /auth with redirect param
  const url = request.nextUrl.clone();
  url.pathname = '/auth';
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images.
     * This ensures the middleware runs on page navigations but not on
     * static asset requests like CSS, JS, fonts, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)).*)',
  ],
};
