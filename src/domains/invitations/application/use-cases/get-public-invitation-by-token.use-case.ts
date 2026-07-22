import type { PublicInvitationDto } from "@/domains/invitations/application/dtos/public-invitation.dto"
import type { PublicInvitationQuery } from "@/domains/invitations/application/ports/public-invitation.query"

export async function getPublicInvitationByTokenUseCase(input: {
  publicInvitationQuery: PublicInvitationQuery
  token: string
}): Promise<PublicInvitationDto | null> {
  return input.publicInvitationQuery.findByToken(input.token)
}
