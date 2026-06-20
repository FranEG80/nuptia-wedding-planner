import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"
import {
  toGuestDto,
  type CreateGuestDto,
  type GuestDto,
} from "@/domains/guests/application/dtos/guest.dto"

export async function createGuestUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  data: CreateGuestDto
}): Promise<GuestDto> {
  const guest = await input.guestRepository.create({
    weddingId: input.weddingId,
    ...input.data,
  })

  return toGuestDto(guest)
}
