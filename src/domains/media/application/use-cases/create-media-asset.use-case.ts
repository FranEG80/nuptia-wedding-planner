import type { MediaRepository } from "@/domains/media/domain/ports/media.repository"
import {
  toMediaAssetDto,
  type CreateMediaAssetDto,
  type MediaAssetDto,
} from "@/domains/media/application/dtos/media-asset.dto"

export async function createMediaAssetUseCase(input: {
  mediaRepository: MediaRepository
  weddingId: string
  data: CreateMediaAssetDto
}): Promise<MediaAssetDto> {
  const asset = await input.mediaRepository.create({
    weddingId: input.weddingId,
    ...input.data,
  })

  return toMediaAssetDto(asset)
}
