import type { PrismaClient } from "@generated/prisma/client"
import type {
  CreateMediaAssetInput,
  MediaRepository,
} from "@/domains/media/domain/ports/media.repository"
import type { MediaAsset } from "@/domains/media/domain/media-asset"

type PrismaMediaAssetRecord = {
  id: string
  weddingId: string
  type: string
  provider: string
  key: string
  url: string
  alt: string | null
}

function assetTypeFromDb(value: string): MediaAsset["type"] {
  if (value === "audio" || value === "video") {
    return value
  }

  return "image"
}

function providerFromDb(value: string): MediaAsset["provider"] {
  return value === "supabase" ? "supabase" : "local"
}

function toMediaAsset(record: PrismaMediaAssetRecord): MediaAsset {
  return {
    id: record.id,
    weddingId: record.weddingId,
    type: assetTypeFromDb(record.type),
    provider: providerFromDb(record.provider),
    key: record.key,
    url: record.url,
    alt: record.alt,
  }
}

export class PrismaMediaRepository implements MediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByWeddingId(weddingId: string): Promise<MediaAsset[]> {
    const assets = await this.prisma.mediaAsset.findMany({
      where: { weddingId },
      orderBy: { createdAt: "desc" },
    })

    return assets.map(toMediaAsset)
  }

  async create(input: CreateMediaAssetInput): Promise<MediaAsset> {
    const asset = await this.prisma.mediaAsset.create({
      data: {
        weddingId: input.weddingId,
        type: input.type,
        provider: input.provider ?? "local",
        key: input.key,
        url: input.url,
        alt: input.alt ?? null,
      },
    })

    return toMediaAsset(asset)
  }
}
