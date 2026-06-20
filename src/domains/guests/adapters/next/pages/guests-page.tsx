import { requireAppSession } from "@/core/auth"
import { repositories } from "@/composition/repositories"
import { DEFAULT_INVITATION_CONTENT } from "@/domains/invitations/domain/invitation-design"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import { listGuestsUseCase } from "@/domains/guests/application/use-cases/list-guests.use-case"
import { GuestsView } from "@/domains/guests/adapters/next/components/guests-view"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export async function GuestsPage() {
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return (
      <GuestsView
        initialGuests={[]}
        initialWhatsappMessage={DEFAULT_INVITATION_CONTENT.whatsappMessage}
      />
    )
  }

  const [guests, design] = await Promise.all([
    listGuestsUseCase({
      guestRepository: repositories.guest,
      weddingId: wedding.id,
    }),
    getCurrentInvitationDesignUseCase({
      invitationRepository: repositories.invitation,
      weddingId: wedding.id,
    }),
  ])

  return (
    <GuestsView
      initialGuests={guests}
      initialWhatsappMessage={
        design?.content.whatsappMessage ?? DEFAULT_INVITATION_CONTENT.whatsappMessage
      }
    />
  )
}
