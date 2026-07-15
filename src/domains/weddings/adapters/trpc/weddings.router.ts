import { getRepositories } from "@/composition/repositories"
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"
import { getDashboardSummaryUseCase } from "@/domains/weddings/application/use-cases/get-dashboard-summary.use-case"

export const weddingsRouter = createTRPCRouter({
  current: protectedProcedure.query(async ({ ctx }) => {
    const repositories = await getRepositories()
    return getCurrentWeddingUseCase({
      weddingRepository: repositories.wedding,
      appUserId: ctx.appUser.id,
    })
  }),
  dashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const repositories = await getRepositories()
    const wedding = await getCurrentWeddingUseCase({
      weddingRepository: repositories.wedding,
      appUserId: ctx.appUser.id,
    })

    if (!wedding) {
      return {
        confirmed: 0,
        pending: 0,
        declined: 0,
        total: 0,
      }
    }

    return getDashboardSummaryUseCase({
      guestRepository: repositories.guest,
      weddingId: wedding.id,
    })
  }),
})
