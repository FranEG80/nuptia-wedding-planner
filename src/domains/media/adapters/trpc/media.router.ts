import { repositories } from "@/composition/repositories"
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init"
import { listMediaAssetsUseCase } from "@/domains/media/application/use-cases/list-media-assets.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export const mediaRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const wedding = await getCurrentWeddingUseCase({
      weddingRepository: repositories.wedding,
      appUserId: ctx.appUser.id,
    })

    if (!wedding) {
      return []
    }

    return listMediaAssetsUseCase({
      mediaRepository: repositories.media,
      weddingId: wedding.id,
    })
  }),
})
