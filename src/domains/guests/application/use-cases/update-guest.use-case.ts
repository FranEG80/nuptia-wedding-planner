import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"
import {
  toGuestDto,
  type GuestDto,
  type UpdateGuestDto,
} from "@/domains/guests/application/dtos/guest.dto"

export async function updateGuestUseCase(input: {
  guestRepository: GuestRepository
  guestId: string
  data: UpdateGuestDto
}): Promise<GuestDto | null> {
  const guest = await input.guestRepository.update(input.guestId, input.data)

  return guest ? toGuestDto(guest) : null
}
