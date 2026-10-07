import { requireAppSession } from "@/core/auth"
import { getRepositories } from "@/composition/repositories"
import { getCurrentWeddingId } from "@/composition/current-wedding"
import { MARIA_DANIELA_CUSTOM_DOMAIN } from "@/domains/invitations/domain/invitation-template-options"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import { SignageView } from "@/domains/guests/adapters/next/components/signage-view"
import { getSeatingPdfTheme } from "@/domains/guests/adapters/next/pages/get-seating-pdf-theme"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

// Solo se carga lo que decide qué PDF se ofrecen; invitados y mesas se piden
// al generar cada uno.
export async function SignagePage() {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return <SignageView seatingPdfTheme={null} placeCardsWebsiteUrl={null} />
  }

  const design = await getCurrentInvitationDesignUseCase({
    invitationRepository: repositories.invitation,
    weddingId,
  })

  const seatingPdfTheme = await getSeatingPdfTheme(
    design?.templateId,
    () =>
      getCurrentWeddingUseCase({
        weddingRepository: repositories.wedding,
        appUserId: session.appUser.id,
      }),
  )

  return (
    <SignageView
      seatingPdfTheme={seatingPdfTheme}
      placeCardsWebsiteUrl={
        design?.templateId === "maria-daniela"
          ? `https://${MARIA_DANIELA_CUSTOM_DOMAIN}`
          : null
      }
    />
  )
}
