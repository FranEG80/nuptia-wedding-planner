import { initTRPC, TRPCError } from "@trpc/server"

import type { TRPCContext } from "@/core/trpc/context"
import { reportUnexpectedApiError } from "@/shared/http/api-errors"

const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ error, shape }) {
    const data = {
      ...shape.data,
      stack: undefined,
    }

    if (error.code !== "INTERNAL_SERVER_ERROR") {
      return {
        ...shape,
        data,
      }
    }

    const requestId = reportUnexpectedApiError("trpc", error)

    return {
      ...shape,
      message: "No se pudo completar la solicitud.",
      data: {
        ...data,
        requestId,
      },
    }
  },
})

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
