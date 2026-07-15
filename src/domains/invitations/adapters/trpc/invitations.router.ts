import { getRepositories } from "@/composition/repositories"
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export const invitationsRouter = createTRPCRouter({
  currentDesign: protectedProcedure.query(async ({ ctx }) => {
    const repositories = await getRepositories()
    const wedding = await getCurrentWeddingUseCase({
      weddingRepository: repositories.wedding,
      appUserId: ctx.appUser.id,
    })

    if (!wedding) {
      return null
    }

    return getCurrentInvitationDesignUseCase({
      invitationRepository: repositories.invitation,
      weddingId: wedding.id,
    })
  }),
})
