import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init"
import { getGuestByIdUseCase } from "@/domains/guests/application/use-cases/get-guest-by-id.use-case"
import { listGuestsUseCase } from "@/domains/guests/application/use-cases/list-guests.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export const guestsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const repositories = await getRepositories()
    const wedding = await getCurrentWeddingUseCase({
      weddingRepository: repositories.wedding,
      appUserId: ctx.appUser.id,
    })

    if (!wedding) {
      return []
    }

    return listGuestsUseCase({
      guestRepository: repositories.guest,
      weddingId: wedding.id,
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
