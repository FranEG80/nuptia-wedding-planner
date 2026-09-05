import { getRepositories } from "@/composition/repositories"
import { getCurrentWeddingId } from "@/composition/current-wedding"
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init"
import { listMediaAssetsUseCase } from "@/domains/media/application/use-cases/list-media-assets.use-case"

export const mediaRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const repositories = await getRepositories()
    const weddingId = await getCurrentWeddingId(ctx.appUser.id)

    if (!weddingId) {
      return []
    }

    return listMediaAssetsUseCase({
      mediaRepository: repositories.media,
      weddingId,
    })
  }),
})
