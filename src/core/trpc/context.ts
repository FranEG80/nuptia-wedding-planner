import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"

import { getCurrentAppSession } from "@/core/auth"

export async function createTRPCContext(_opts: FetchCreateContextFnOptions) {
  void _opts

  const appSession = await getCurrentAppSession()

  return {
    appSession,
    appUser: appSession?.appUser ?? null,
    session: appSession?.auth ?? null,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>
