import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"
import type { DashboardSummaryDto } from "@/domains/weddings/application/dtos/dashboard-summary.dto"

export async function getDashboardSummaryUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
}): Promise<DashboardSummaryDto> {
  return input.guestRepository.getRsvpSummaryByWeddingId(input.weddingId)
}
