import type { WeddingRepository } from "@/domains/weddings/domain/ports/wedding.repository"
import {
  toWeddingDto,
  type UpdateWeddingDto,
  type WeddingDto,
} from "@/domains/weddings/application/dtos/wedding.dto"

export async function updateWeddingUseCase(input: {
  weddingRepository: WeddingRepository
  weddingId: string
  data: UpdateWeddingDto
}): Promise<WeddingDto | null> {
  const wedding = await input.weddingRepository.update(
    input.weddingId,
    input.data,
  )

  return wedding ? toWeddingDto(wedding) : null
}
