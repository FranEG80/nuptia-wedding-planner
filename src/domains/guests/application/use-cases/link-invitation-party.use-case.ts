import {
  toInvitationPartyDto,
  type InvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"

export async function linkInvitationPartyUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  targetPartyId: string
  sourcePartyId: string
}): Promise<InvitationPartyDto | null> {
  if (input.targetPartyId === input.sourcePartyId) {
    throw new Error("No se puede vincular una invitación consigo misma")
  }

  const party = await input.guestRepository.linkInvitationParty(
    input.targetPartyId,
    input.sourcePartyId,
    input.weddingId,
  )

  return party ? toInvitationPartyDto(party) : null
}
