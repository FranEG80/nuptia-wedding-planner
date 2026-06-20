import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"
import {
  toGuestDto,
  type GuestDto,
} from "@/domains/guests/application/dtos/guest.dto"

export async function listGuestsUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
}): Promise<GuestDto[]> {
  const guests = await input.guestRepository.listByWeddingId(input.weddingId)

  return guests.map(toGuestDto)
}
