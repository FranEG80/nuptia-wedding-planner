import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"
import {
  toGuestDto,
  type GuestDto,
} from "@/domains/guests/application/dtos/guest.dto"

export async function getGuestByIdUseCase(input: {
  guestRepository: GuestRepository
  guestId: string
}): Promise<GuestDto | null> {
  const guest = await input.guestRepository.findById(input.guestId)

  return guest ? toGuestDto(guest) : null
}
