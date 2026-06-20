import type { MediaAsset } from "@/domains/media/domain/media-asset"
import type {
  CreateMediaAssetInput,
  MediaRepository,
} from "@/domains/media/domain/ports/media.repository"

let demoMediaAssets: MediaAsset[] = []

export const demoMediaRepository: MediaRepository = {
  async listByWeddingId(weddingId) {
    return demoMediaAssets.filter((asset) => asset.weddingId === weddingId)
  },

  async create(input: CreateMediaAssetInput) {
    const asset: MediaAsset = {
      id: `media-${Date.now()}`,
      weddingId: input.weddingId,
      type: input.type,
      provider: input.provider ?? "local",
      key: input.key,
      url: input.url,
      alt: input.alt ?? null,
    }

    demoMediaAssets = [...demoMediaAssets, asset]

    return asset
  },
}
