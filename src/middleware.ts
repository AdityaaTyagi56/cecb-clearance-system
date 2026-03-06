// middleware.ts — Route protection by role (PRD Section 10, 11)
// This runs on the Edge before every request

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require specific roles
const ROLE_ROUTES: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/applications/new": ["PROPONENT"],
  "/applications/mine": ["PROPONENT"],
};

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes — always allow
  if (pathname === "/" || pathname === "/register") {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const userRole = session.user.role;

  // Check role-specific restrictions
  for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(userRole as string)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
