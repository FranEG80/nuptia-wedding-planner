import {
  toInvitationPartyDto,
  updateInvitationPartySchema,
  type InvitationPartyDto,
  type UpdateInvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"

export async function updateInvitationPartyUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  data: UpdateInvitationPartyDto
}): Promise<InvitationPartyDto | null> {
  const data = updateInvitationPartySchema.parse(input.data)
  const party = await input.guestRepository.updateInvitationParty(data.partyId, {
    weddingId: input.weddingId,
    groupName: data.groupName,
    guests: data.guests,
  })

  return party ? toInvitationPartyDto(party) : null
}
