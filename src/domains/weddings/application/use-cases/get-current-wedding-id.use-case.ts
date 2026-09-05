import type { WeddingRepository } from "@/domains/weddings/domain/ports/wedding.repository"

export async function getCurrentWeddingIdUseCase(input: {
  weddingRepository: WeddingRepository
  appUserId: string
}): Promise<string | null> {
  return input.weddingRepository.findCurrentWeddingIdByAppUserId(
    input.appUserId,
  )
}
