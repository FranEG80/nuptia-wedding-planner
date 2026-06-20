import type { MediaRepository } from "@/domains/media/domain/ports/media.repository"
import {
  toMediaAssetDto,
  type MediaAssetDto,
} from "@/domains/media/application/dtos/media-asset.dto"

export async function listMediaAssetsUseCase(input: {
  mediaRepository: MediaRepository
  weddingId: string
}): Promise<MediaAssetDto[]> {
  const assets = await input.mediaRepository.listByWeddingId(input.weddingId)

  return assets.map(toMediaAssetDto)
}
