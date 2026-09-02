import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, loginPath, signupPath } from "@/lib/auth/paths";

const AUTHENTICATED_PREFIXES = [
  "/library",
  "/orders",
  "/profile",
  "/dashboard",
  "/admin",
  "/become-a-creator",
];

function needsAuth(pathname: string): boolean {
  return AUTHENTICATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!needsAuth(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) {
    return NextResponse.next();
  }

  const next = `${pathname}${search}`;
  const dest = pathname.startsWith("/become-a-creator")
    ? signupPath(next)
    : loginPath(next);

  return NextResponse.redirect(new URL(dest, request.url));
}

export const config = {
  matcher: [
    "/library/:path*",
    "/library",
    "/orders/:path*",
    "/orders",
    "/profile/:path*",
    "/profile",
    "/dashboard/:path*",
    "/dashboard",
    "/admin/:path*",
    "/admin",
    "/become-a-creator/:path*",
    "/become-a-creator",
  ],
};
