import { initTRPC, TRPCError } from "@trpc/server"

import type { TRPCContext } from "@/core/trpc/context"

const t = initTRPC.context<TRPCContext>().create()

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.appUser || !ctx.appSession) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    })
  }

  return next({
    ctx: {
      appSession: ctx.appSession,
      appUser: ctx.appUser,
      session: ctx.session,
    },
  })
})
