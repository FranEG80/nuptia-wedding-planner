import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"
import type { InvitationRepository } from "@/domains/invitations/domain/ports/invitation.repository"
import {
  toPublicInvitationDto,
  type PublicInvitationDto,
} from "@/domains/invitations/application/dtos/public-invitation.dto"
import type { WeddingRepository } from "@/domains/weddings/domain/ports/wedding.repository"

export async function getPublicInvitationByTokenUseCase(input: {
  guestRepository: GuestRepository
  invitationRepository: InvitationRepository
  weddingRepository: WeddingRepository
  token: string
}): Promise<PublicInvitationDto | null> {
  const party = await input.guestRepository.findPartyByInviteToken(input.token)

  if (!party) {
    return null
  }

  const [wedding, design, menu] = await Promise.all([
    input.weddingRepository.findById(party.weddingId),
    input.invitationRepository.findCurrentDesignByWeddingId(party.weddingId),
    input.weddingRepository.findMenuDetailsByWeddingId(party.weddingId),
  ])

  if (!wedding || !design) {
    return null
  }

  return toPublicInvitationDto({ party, wedding, design, menu })
}
