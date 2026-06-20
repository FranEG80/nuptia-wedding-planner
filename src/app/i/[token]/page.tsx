import { notFound } from "next/navigation"

import { repositories } from "@/composition/repositories"
import { ResolvedInvitationTemplate } from "@/domains/invitations/adapters/next/components/resolve-invitation-template"
import { PublicRsvpPanel } from "@/domains/invitations/adapters/next/components/public-rsvp-panel"
import { getPublicInvitationByTokenUseCase } from "@/domains/invitations/application/use-cases/get-public-invitation-by-token.use-case"
import { normalizeInvitationTemplateId } from "@/domains/invitations/domain/invitation-template-options"

export default async function PublicInvitationRoutePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invitation = await getPublicInvitationByTokenUseCase({
    guestRepository: repositories.guest,
    invitationRepository: repositories.invitation,
    weddingRepository: repositories.wedding,
    token,
  })

  if (!invitation) {
    notFound()
  }

  return (
    <ResolvedInvitationTemplate
      templateId={normalizeInvitationTemplateId(invitation.design.templateId)}
      wedding={invitation.wedding}
      content={invitation.design.content}
      rsvpSlot={
        <PublicRsvpPanel
          token={token}
          guests={invitation.guests}
          menu={invitation.menu}
          title={invitation.design.content.rsvpTitle}
          subtitle={invitation.design.content.rsvpSubtitle}
          panelMotion={invitation.design.content.rsvpPanelMotion}
        />
      }
    />
  )
}
