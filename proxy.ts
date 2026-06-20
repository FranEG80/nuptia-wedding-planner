import { NextResponse, type NextRequest } from "next/server"

function hasAnyAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => {
    return (
      cookie.name.includes("better-auth") ||
      cookie.name.startsWith("sb-") ||
      cookie.name === "session"
    )
  })
}

export function proxy(request: NextRequest) {
  const shouldEnforceAuth = process.env.AUTH_ENFORCE === "true"

  if (!shouldEnforceAuth) {
    return NextResponse.next()
  }

  if (!hasAnyAuthCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/app/:path*"],
}
