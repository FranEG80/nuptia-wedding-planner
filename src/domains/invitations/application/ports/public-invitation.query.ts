import type { PublicInvitationDto } from "@/domains/invitations/application/dtos/public-invitation.dto"

export interface PublicInvitationQuery {
  findByToken(token: string): Promise<PublicInvitationDto | null>
}
