import { repositories } from "@/composition/repositories"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/core/trpc/init"
import { getPublicWeddingSiteUseCase } from "@/domains/wedding-sites/application/use-cases/get-public-wedding-site.use-case"
import { listWeddingSiteModulesUseCase } from "@/domains/wedding-sites/application/use-cases/list-wedding-site-modules.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"
import { z } from "zod"

export const weddingSiteRouter = createTRPCRouter({
  modules: protectedProcedure.query(async ({ ctx }) => {
    const wedding = await getCurrentWeddingUseCase({
      weddingRepository: repositories.wedding,
      appUserId: ctx.appUser.id,
    })

    if (!wedding) {
      return []
    }

    return listWeddingSiteModulesUseCase({
      weddingSiteRepository: repositories.weddingSite,
      weddingId: wedding.id,
    })
  }),
  publicBySlug: publicProcedure
    .input(z.string().min(1).default("demo"))
    .query(({ input }) =>
      getPublicWeddingSiteUseCase({
        weddingSiteRepository: repositories.weddingSite,
        slug: input,
      }),
    ),
})
