import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { MARIA_DANIELA_CUSTOM_DOMAIN } from "@/domains/invitations/domain/invitation-template-options"

const WEDDING_SLUG_BY_DOMAIN: Record<string, string> = {
  [MARIA_DANIELA_CUSTOM_DOMAIN]: "nacho-y-maria-daniela",
  [`www.${MARIA_DANIELA_CUSTOM_DOMAIN}`]: "nacho-y-maria-daniela",
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
