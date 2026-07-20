import { toGuestDto, type GuestDto } from "@/domains/guests/application/dtos/guest.dto"
import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"

export async function unassignGuestSeatUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  guestId: string
}): Promise<GuestDto | null> {
  const updated = await input.guestRepository.unassignSeat(
    input.guestId,
    input.weddingId,
  )

  return updated ? toGuestDto(updated) : null
}
