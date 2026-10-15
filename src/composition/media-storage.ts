import "server-only"

import { getCloudflareContext } from "@opennextjs/cloudflare"

import { env, getR2S3Credentials } from "@/core/config/env"
import { LocalGuestPhotoStorage } from "@/domains/guest-photos/adapters/r2/local-guest-photo-storage"
import { R2MediaObjectStorage } from "@/domains/media/adapters/r2/r2-media-object-storage"
import { R2S3MediaObjectStorage } from "@/domains/media/adapters/r2/r2-s3-media-object-storage"
import type {
  DirectUploadMediaObjectStorage,
  MediaObjectStorage,
} from "@/domains/media/domain/ports/media-object-storage"

const usesLocalBucket = () => process.env.NODE_ENV === "development" && process.env.VERCEL !== "1"

/** En desarrollo usa el binding local; en producción firma contra la API S3. */
export function getDirectUploadMediaStorage(): DirectUploadMediaObjectStorage | null {
  if (usesLocalBucket()) {
    const { env: cloudflareEnv } = getCloudflareContext()
    return new LocalGuestPhotoStorage(cloudflareEnv.MEDIA_BUCKET, env.BETTER_AUTH_SECRET)
  }

  const credentials = getR2S3Credentials()

  return credentials ? new R2S3MediaObjectStorage(credentials) : null
}

export function getMediaObjectStorage(): MediaObjectStorage {
  // En Vercel no existe el binding: con credenciales S3 se usa la API de R2.
  const directStorage = getDirectUploadMediaStorage()

  if (directStorage) {
    return directStorage
  }

  const { env: cloudflareEnv } = getCloudflareContext()
  return new R2MediaObjectStorage(cloudflareEnv.MEDIA_BUCKET)
}

/**
 * URL pública de un objeto del bucket: el dominio público de R2 si está
 * configurado, o la ruta de la app que lo sirve desde el bucket.
 */
export function mediaPublicUrl(key: string) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/")
  const publicBaseUrl = usesLocalBucket() ? "" : env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "")

  return publicBaseUrl
    ? `${publicBaseUrl}/${encodedKey}`
    : `/api/media/files/${encodedKey}`
}
