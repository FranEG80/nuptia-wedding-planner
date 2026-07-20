import { PUBLIC_DEMO_ACCOUNT } from "@/core/auth/demo-account"
import type { AppSession } from "@/core/auth/types"

export function isDemoSession(session: AppSession): boolean {
  return session.appUser.id === PUBLIC_DEMO_ACCOUNT.appUserId
}
