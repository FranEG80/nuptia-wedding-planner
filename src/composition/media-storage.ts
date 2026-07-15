import "server-only"

import { getCloudflareContext } from "@opennextjs/cloudflare"

import { R2MediaObjectStorage } from "@/domains/media/adapters/r2/r2-media-object-storage"

export function getMediaObjectStorage() {
  const { env } = getCloudflareContext()
  return new R2MediaObjectStorage(env.MEDIA_BUCKET)
}
