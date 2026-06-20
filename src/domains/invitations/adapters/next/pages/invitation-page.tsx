import { requireAppSession } from "@/core/auth"
import { repositories } from "@/composition/repositories"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import { InvitationView } from "@/domains/invitations/adapters/next/components/invitation-view"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export async function InvitationPage() {
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const design = await getCurrentInvitationDesignUseCase({
    invitationRepository: repositories.invitation,
    weddingId: wedding.id,
  })

  if (!design) {
    return null
  }

  return <InvitationView initialDesign={design} />
}
