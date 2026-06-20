import type { WeddingRepository } from "@/domains/weddings/domain/ports/wedding.repository"
import {
  toWeddingDto,
  type CreateWeddingDto,
  type WeddingDto,
} from "@/domains/weddings/application/dtos/wedding.dto"

export async function createWeddingUseCase(input: {
  weddingRepository: WeddingRepository
  ownerId: string
  data: CreateWeddingDto
}): Promise<WeddingDto> {
  const wedding = await input.weddingRepository.create({
    ownerId: input.ownerId,
    ...input.data,
  })

  return toWeddingDto(wedding)
}
