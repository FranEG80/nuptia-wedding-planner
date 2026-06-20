import type { MediaAsset } from "@/domains/media/domain/media-asset"

export interface CreateMediaAssetInput {
  weddingId: string
  type: MediaAsset["type"]
  provider?: MediaAsset["provider"]
  key: string
  url: string
  alt?: string | null
}

export interface MediaRepository {
  listByWeddingId(weddingId: string): Promise<MediaAsset[]>
  create(input: CreateMediaAssetInput): Promise<MediaAsset>
}
