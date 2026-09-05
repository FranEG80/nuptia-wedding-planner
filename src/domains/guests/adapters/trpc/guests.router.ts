import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { getCurrentWeddingId } from "@/composition/current-wedding"
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init"
import { getGuestByIdUseCase } from "@/domains/guests/application/use-cases/get-guest-by-id.use-case"
import { listGuestsUseCase } from "@/domains/guests/application/use-cases/list-guests.use-case"

export const guestsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const repositories = await getRepositories()
    const weddingId = await getCurrentWeddingId(ctx.appUser.id)

    if (!weddingId) {
      return []
    }

    return listGuestsUseCase({
      guestRepository: repositories.guest,
      weddingId,
    })
  }),
  byId: protectedProcedure.input(z.string()).query(async ({ input }) => {
    const repositories = await getRepositories()
    return getGuestByIdUseCase({
      guestRepository: repositories.guest,
      guestId: input,
    })
  }),
})
