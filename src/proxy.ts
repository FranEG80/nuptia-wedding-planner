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

export default function proxy(request: NextRequest) {
  const shouldEnforceAuth = process.env.AUTH_ENFORCE === "true"

  if (!shouldEnforceAuth) {
    return NextResponse.next()
  }

  if (!hasAnyAuthCookie(request)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", request.nextUrl.pathname)

    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/app/:path*"],
}
