import {
  toInvitationPartyDto,
  type InvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"

export async function listInvitationPartiesUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
}): Promise<InvitationPartyDto[]> {
  const parties = await input.guestRepository.listPartiesByWeddingId(
    input.weddingId,
  )

  return parties.map(toInvitationPartyDto)
}
