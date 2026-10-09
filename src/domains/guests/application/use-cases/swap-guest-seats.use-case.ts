import {
  swapGuestSeatsSchema,
  type GuestSeatPositionDto,
  type SwapGuestSeatsDto,
} from "@/domains/guests/application/dtos/table.dto"
import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"

export async function swapGuestSeatsUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  data: SwapGuestSeatsDto
}): Promise<GuestSeatPositionDto[] | null> {
  const data = swapGuestSeatsSchema.parse(input.data)

  return input.guestRepository.swapSeats(
    data.guestId,
    data.otherGuestId,
    input.weddingId,
  )
}
