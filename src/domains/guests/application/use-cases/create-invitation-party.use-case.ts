import {
  createInvitationPartySchema,
  toInvitationPartyDto,
  type CreateInvitationPartyDto,
  type InvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"

export async function createInvitationPartyUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  data: CreateInvitationPartyDto
}): Promise<InvitationPartyDto> {
  const data = createInvitationPartySchema.parse(input.data)
  const party = await input.guestRepository.createInvitationParty({
    weddingId: input.weddingId,
    groupName: data.groupName,
    guests: data.guests,
  })

  return toInvitationPartyDto(party)
}
