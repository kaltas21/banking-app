import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes protection
    if (path.startsWith('/admin')) {
      if (!token || token.userType !== 'employee') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // Customer routes protection
    if (path.startsWith('/dashboard') || path.startsWith('/accounts') || 
        path.startsWith('/transfer') || path.startsWith('/loans')) {
      if (!token || token.userType !== 'customer') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/accounts/:path*',
    '/transfer/:path*',
    '/loans/:path*',
    '/admin/:path*'
  ]
};