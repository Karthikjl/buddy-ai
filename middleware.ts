import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Server-level immediate redirect: if authenticated user accesses login or root, go to dashboard
    if ((pathname === "/login" || pathname === "/") && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If unauthenticated user hits root, send straight to login
    if (pathname === "/" && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role-based admin access control
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      const role = token?.role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // Allow public access to landing/auth routes
        if (
          pathname === "/" ||
          pathname === "/login" ||
          pathname === "/api/setup-status" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon.ico") ||
          pathname.startsWith("/icon.") ||
          pathname.startsWith("/logo.") ||
          pathname.startsWith("/public")
        ) {
          return true;
        }

        // Must be authenticated for everything else
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/chat/:path*",
    "/characters/:path*",
    "/marketplace/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/keys",
    "/api/keys/:path*",
    "/api/sessions",
    "/api/sessions/:path*",
    "/api/chat",
    "/api/chat/:path*",
    "/api/characters",
    "/api/characters/:path*",
    "/api/memories",
    "/api/memories/:path*",
    "/api/preferences",
    "/api/preferences/:path*",
    "/api/telegram/:path*",
    "/api/backup/:path*",
    "/api/checkins/:path*",
  ],
};
