import { NextResponse, type NextRequest } from 'next/server';

/**
 * MIDDLEWARE — Login check COMMENTED OUT for development
 * Sab pages open hain bina login ke
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Root pe aaye toh directly dashboard pe bhejo
  if (path === '/' || path === '/login' || path === '/signup') {
    const url = request.nextUrl.clone();
    url.pathname = '/store/dashboard';
    return NextResponse.redirect(url);
  }

  // Baaki sab open
  return NextResponse.next();

  // --- ORIGINAL CODE (uncomment for production) ---
  // const path = request.nextUrl.pathname;
  // if (path.startsWith('/api')) return NextResponse.next();
  // const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || 
  //                     path.startsWith('/forgot-password') || path.startsWith('/reset-password');
  // const isProtectedRoute = path.startsWith('/store') || path.startsWith('/customer');
  // const token = request.cookies.get('auth-token')?.value;
  // if (!token && isProtectedRoute) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/login';
  //   url.searchParams.set('redirect', path);
  //   return NextResponse.redirect(url);
  // }
  // if (token && isAuthRoute) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/store/dashboard';
  //   url.search = '';
  //   return NextResponse.redirect(url);
  // }
  // return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
