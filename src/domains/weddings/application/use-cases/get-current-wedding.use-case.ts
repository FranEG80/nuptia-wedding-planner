import type { WeddingRepository } from "@/domains/weddings/domain/ports/wedding.repository"
import {
  toWeddingDto,
  type WeddingDto,
} from "@/domains/weddings/application/dtos/wedding.dto"

export async function getCurrentWeddingUseCase(input: {
  weddingRepository: WeddingRepository
  appUserId: string
}): Promise<WeddingDto | null> {
  const wedding = await input.weddingRepository.findCurrentByAppUserId(
    input.appUserId,
  )

  return wedding ? toWeddingDto(wedding) : null
}
