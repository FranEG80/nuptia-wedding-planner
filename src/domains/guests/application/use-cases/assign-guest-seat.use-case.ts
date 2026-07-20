import { toGuestDto, type GuestDto } from "@/domains/guests/application/dtos/guest.dto"
import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"
import type { TableRepository } from "@/domains/guests/domain/ports/table.repository"

export async function assignGuestSeatUseCase(input: {
  guestRepository: GuestRepository
  tableRepository: TableRepository
  weddingId: string
  guestId: string
  tableId: string
}): Promise<GuestDto | null> {
  const guest = await input.guestRepository.findById(input.guestId)

  if (!guest || guest.weddingId !== input.weddingId) {
    throw new Error("El invitado no pertenece a esta boda")
  }

  const tables = await input.tableRepository.listByWeddingId(input.weddingId)

  if (!tables.some((table) => table.id === input.tableId)) {
    throw new Error("La mesa no pertenece a esta boda")
  }

  const updated = await input.guestRepository.assignSeat(
    input.guestId,
    input.weddingId,
    input.tableId,
  )

  return updated ? toGuestDto(updated) : null
}
