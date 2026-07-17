import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    // Check if user is already authenticated
    const sessionCookie = request.cookies.get("spendy_session");
    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        if (session.userId) {
          // Already authenticated, redirect to dashboard
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch {
        // Invalid session, continue to login page
      }
    }
    return NextResponse.next();
  }

  // Protect all other routes
  const sessionCookie = request.cookies.get("spendy_session");
  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    if (!session.userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, _next, public APIs, and auth APIs
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/seed|api/ocr).*)",
  ],
};
