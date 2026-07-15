import type {
  MediaObjectStorage,
  PutMediaObjectInput,
  StoredMediaObject,
} from "@/domains/media/domain/ports/media-object-storage"

export class R2MediaObjectStorage implements MediaObjectStorage {
  constructor(private readonly bucket: R2Bucket) {}

  async put(input: PutMediaObjectInput): Promise<void> {
    const stored = await this.bucket.put(input.key, input.body, {
      httpMetadata: {
        contentType: input.contentType,
        cacheControl: input.cacheControl,
      },
    })

    if (!stored) {
      throw new Error("R2 rejected the media upload")
    }
  }

  async get(key: string): Promise<StoredMediaObject | null> {
    const object = await this.bucket.get(key)

    if (!object) {
      return null
    }

    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType ?? null,
      cacheControl: object.httpMetadata?.cacheControl ?? null,
      etag: object.httpEtag,
    }
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key)
  }
}
