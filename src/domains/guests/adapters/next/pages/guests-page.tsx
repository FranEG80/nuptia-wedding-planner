import { requireAppSession } from "@/core/auth"
import { getRepositories } from "@/composition/repositories"
import { DEFAULT_INVITATION_CONTENT } from "@/domains/invitations/domain/invitation-design"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import { listInvitationPartiesUseCase } from "@/domains/guests/application/use-cases/list-invitation-parties.use-case"
import { listTablesUseCase } from "@/domains/guests/application/use-cases/list-tables.use-case"
import { GuestsView } from "@/domains/guests/adapters/next/components/guests-view"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export async function GuestsPage() {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return (
      <GuestsView
        initialParties={[]}
        initialTables={[]}
        initialWhatsappMessage={DEFAULT_INVITATION_CONTENT.whatsappMessage}
      />
    )
  }

  const [parties, tables, design] = await Promise.all([
    listInvitationPartiesUseCase({
      guestRepository: repositories.guest,
      weddingId: wedding.id,
    }),
    listTablesUseCase({
      tableRepository: repositories.table,
      weddingId: wedding.id,
    }),
    getCurrentInvitationDesignUseCase({
      invitationRepository: repositories.invitation,
      weddingId: wedding.id,
    }),
  ])

  return (
    <GuestsView
      initialParties={parties}
      initialTables={tables}
      initialWhatsappMessage={
        design?.content.whatsappMessage ?? DEFAULT_INVITATION_CONTENT.whatsappMessage
      }
    />
  )
}
