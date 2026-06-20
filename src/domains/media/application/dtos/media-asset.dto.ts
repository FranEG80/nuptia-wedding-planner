import type { MediaAsset } from "@/domains/media/domain/media-asset"

export interface MediaAssetDto {
  id: string
  weddingId: string
  type: MediaAsset["type"]
  provider: MediaAsset["provider"]
  key: string
  url: string
  alt: string | null
}

export interface CreateMediaAssetDto {
  type: MediaAssetDto["type"]
  provider?: MediaAssetDto["provider"]
  key: string
  url: string
  alt?: string | null
}

export function toMediaAssetDto(asset: MediaAsset): MediaAssetDto {
  return {
    id: asset.id,
    weddingId: asset.weddingId,
    type: asset.type,
    provider: asset.provider,
    key: asset.key,
    url: asset.url,
    alt: asset.alt,
  }
}
