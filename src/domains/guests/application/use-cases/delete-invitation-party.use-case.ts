import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"

export async function deleteInvitationPartyUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  partyId: string
}): Promise<boolean> {
  return input.guestRepository.deleteInvitationParty(input.partyId, input.weddingId)
}
