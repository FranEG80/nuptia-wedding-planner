import { requireAppSession } from "@/core/auth"
import { getRepositories } from "@/composition/repositories"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import { InvitationView } from "@/domains/invitations/adapters/next/components/invitation-view"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"
import { NACHO_WEDDING_SLUG } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"

export async function InvitationPage() {
  const repositories = await getRepositories()
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

  return (
    <InvitationView
      initialDesign={design}
      bespoke={wedding.slug === NACHO_WEDDING_SLUG}
    />
  )
}
