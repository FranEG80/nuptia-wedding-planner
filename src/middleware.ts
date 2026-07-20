import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const WEDDING_SLUG_BY_DOMAIN: Record<string, string> = {
  "bodamariadanielaynacho.es": "nacho-y-maria-daniela",
  "www.bodamariadanielaynacho.es": "nacho-y-maria-daniela",
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? ""
  const slug = WEDDING_SLUG_BY_DOMAIN[host]

  if (slug) {
    return NextResponse.rewrite(new URL(`/w/${slug}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/",
}
