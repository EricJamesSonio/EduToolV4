import { NextResponse, type NextRequest } from "next/server";

/**
 * Server-side route protection for authenticated areas.
 *
 * Runs in the Edge runtime BEFORE any React code renders, so a protected
 * route can never paint a single frame of UI for an unauthenticated visitor —
 * even under rapid back-button spam that could otherwise race the client-side
 * guard.
 *
 * Session check: the backend stores the refresh token in an httpOnly
 * `refreshToken` cookie on login and clears it on logout. Its presence is the
 * session signal here. The in-memory access token is not cookie-visible, so we
 * deliberately do not attempt to validate the token contents here;
 * expired/invalid tokens are caught downstream by the API 401 interceptor and
 * `useRoleGuard`.
 *
 * `useRoleGuard` remains the secondary, in-app protection layer.
 *
 * NOTE: In Next.js 16 the `middleware.ts` convention was renamed to `proxy.ts`.
 * This file is the successor and behaves identically (same `matcher` config).
 */
const PROTECTED_ROUTE_PREFIXES = ["/admin", "/educator", "/student", "/platform"];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.has("refreshToken");

  if (!hasSession) {
    // Absolute URL + /login (which is never matched below) => no redirect loop.
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/educator/:path*",
    "/student/:path*",
    "/platform/:path*",
  ],
};
