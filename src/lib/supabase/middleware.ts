import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/forgot-password') || path.startsWith('/reset-password');
  const isOwnerRoute = path.startsWith('/store');
  const isCustomerRoute = path.startsWith('/customer');
  const isApiRoute = path.startsWith('/api');

  // Unauthenticated users cannot access protected routes
  if (!user && (isOwnerRoute || isCustomerRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // Authenticated users shouldn't see auth pages
  if (user && isAuthRoute) {
    // Determine where to redirect based on role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();
    if (profile?.role === 'customer') {
      url.pathname = '/customer/dashboard';
    } else {
      url.pathname = '/store/dashboard';
    }
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (user && (isOwnerRoute || isCustomerRoute)) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Customers cannot access owner routes
    if (role === 'customer' && isOwnerRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/customer/dashboard';
      return NextResponse.redirect(url);
    }

    // Store owners cannot access customer routes
    if (role === 'store_owner' && isCustomerRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/store/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // API route protection (except cron which uses its own auth)
  if (isApiRoute && !path.startsWith('/api/cron')) {
    // Public API routes that don't need auth
    const publicRoutes = ['/api/email/validate'];
    if (!publicRoutes.includes(path) && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return supabaseResponse;
}
