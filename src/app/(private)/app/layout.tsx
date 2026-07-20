import type { ReactNode } from "react"

import { PrivateShell } from "@/app/(private)/app/_components/private-shell"
import { requireAppSession } from "@/core/auth"
import { isDemoSession } from "@/core/demo/is-demo-session"

export default async function PrivateAppLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await requireAppSession()

  return (
    <PrivateShell
      userName={session.appUser.name}
      userEmail={session.appUser.email}
      isDemo={isDemoSession(session)}
    >
      {children}
    </PrivateShell>
  )
}
