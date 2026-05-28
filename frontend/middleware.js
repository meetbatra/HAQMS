import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('haqms_token');
  const path = request.nextUrl.pathname;

  const publicPaths = ['/login', '/queue', '/'];
  const isPublic = publicPaths.includes(path);

  // Exclude API, static files, next static files, etc.
  if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.')) {
    return NextResponse.next();
  }

  // Only redirect authenticated users away from login (not the other way around)
  // Component-level guards will handle redirecting unauthenticated users to login
  // This prevents race conditions where cookie isn't synced yet on cross-domain redirects
  if (token && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
