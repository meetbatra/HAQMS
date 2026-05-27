import { NextResponse } from 'next/server';

export function proxy(request) {
  const token = request.cookies.get('haqms_token');
  const path = request.nextUrl.pathname;

  const publicPaths = ['/login', '/queue'];
  
  // Exclude API, static files, next static files, etc.
  if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.')) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.includes(path) || path === '/';

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
