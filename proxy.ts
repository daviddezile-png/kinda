import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Protect staff areas (Next 16 renamed `middleware` → `proxy`). Teachers + admins
// may enter /teacher; only admins /admin. Students need no login (spec 09 — the
// teacher selects the student from the class grid).
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const needsAuth = pathname.startsWith("/teacher") || pathname.startsWith("/admin")
  if (!needsAuth) return NextResponse.next()

  if (!token) {
    const login = new URL("/auth/login", req.url)
    login.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(login)
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/teacher", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/teacher/:path*", "/admin/:path*"],
}
