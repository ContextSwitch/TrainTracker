import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './app/utils/auth-server';

export function middleware(request: NextRequest) {
  // Debug request info
  console.log('Middleware processing path:', request.nextUrl.pathname);
  
  // HTTPS redirect as fallback (primary redirect happens at ALB level)
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }

  // Skip auth check for login page and non-admin API routes
  if (
    request.nextUrl.pathname.startsWith('/admin/login') ||
    (request.nextUrl.pathname.startsWith('/api/') && 
     !request.nextUrl.pathname.startsWith('/api/admin/'))
  ) {
    console.log('Skipping auth check for:', request.nextUrl.pathname);
    return NextResponse.next();
  }
  
  // Skip auth check for specific admin API routes that need to be publicly accessible
  if (
    request.nextUrl.pathname.startsWith('/api/admin/data/') ||
    request.nextUrl.pathname === '/api/admin/check-auth'
  ) {
    console.log('Skipping auth check for admin data API:', request.nextUrl.pathname);
    return NextResponse.next();
  }

  // Check for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Checking auth for admin route:', request.nextUrl.pathname);
    
    // Check if this is a direct access with auth param (from login redirect)
    const searchParams = request.nextUrl.searchParams;
    const hasAuthParam = searchParams.get('auth') === 'true';
    
    if (hasAuthParam) {
      console.log('Direct access with auth param, allowing access');
      // Create a new URL without the auth parameter for cleaner URLs
      const cleanUrl = new URL(request.nextUrl.pathname, request.url);
      // Keep other query params except 'auth'
      searchParams.forEach((value, key) => {
        if (key !== 'auth') {
          cleanUrl.searchParams.set(key, value);
        }
      });
      
      // Allow access but rewrite to clean URL
      return NextResponse.rewrite(cleanUrl);
    }
    
    // Get token from cookies
    const token = request.cookies.get('admin_token')?.value;
    
    // Debug token
    console.log('Middleware checking token:', token ? 'Token exists' : 'No token');
    
    // Check for auth header (set by client-side code when using localStorage)
    const authHeader = request.headers.get('x-admin-auth');
    
    // If we have an auth header, allow access immediately
    if (authHeader === 'true') {
      console.log('Found valid auth header, allowing access');
      return NextResponse.next();
    }
    
    // If no token and no auth header, redirect to login
    if (!token) {
      console.log('No token found in cookies and no auth header, redirecting to login');
      // Add cache busting parameter
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('t', Date.now().toString());
      return NextResponse.redirect(loginUrl);
    }
    
    try {
      const user = verifyToken(token);
      if (!user) {
        console.log('Invalid token, redirecting to login');
        // Add cache busting parameter
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('t', Date.now().toString());
        return NextResponse.redirect(loginUrl);
      }
      
      console.log('Valid token for user:', user.username);
      
      // Add the user to the request headers for potential use in the application
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-admin-user', user.username);
      
      // Return the response with the modified headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Token verification error:', error);
      // Add cache busting parameter
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('t', Date.now().toString());
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg).*)',
  ],
};
