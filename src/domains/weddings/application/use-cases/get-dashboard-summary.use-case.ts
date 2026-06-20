import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"
import type { DashboardSummaryDto } from "@/domains/weddings/application/dtos/dashboard-summary.dto"

export async function getDashboardSummaryUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
}): Promise<DashboardSummaryDto> {
  const guests = await input.guestRepository.listByWeddingId(input.weddingId)

  const confirmed = guests.filter((guest) => guest.rsvp === "Confirmado").length
  const pending = guests.filter((guest) => guest.rsvp === "Sin respuesta").length
  const declined = guests.filter((guest) => guest.rsvp === "Declinado").length

  return {
    confirmed,
    pending,
    declined,
    total: guests.length,
  }
}
