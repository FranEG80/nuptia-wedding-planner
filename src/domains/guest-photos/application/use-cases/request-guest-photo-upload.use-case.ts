import {
  resolveGuestPhotoUploader,
  type GuestPhotoUploaderContext,
} from "@/domains/guest-photos/application/resolve-guest-photo-uploader"
import type { GuestPhotoUploaderClaim } from "@/domains/guest-photos/domain/guest-photo"
import {
  GUEST_PHOTO_MAX_BYTES,
  GUEST_PHOTO_UPLOAD_URL_TTL_SECONDS,
  guestPhotoExtension,
  guestPhotoKeys,
} from "@/domains/guest-photos/domain/guest-photo-rules"
import type { GuestPhotoStorage } from "@/domains/guest-photos/domain/ports/guest-photo-storage"

export type RequestGuestPhotoUploadResult =
  | { status: "ready"; photoId: string; uploadUrl: string }
  | { status: "unknown_uploader" }
  | { status: "unsupported_type" }
  | { status: "too_large" }

/**
 * Primer paso de la subida: valida a quien sube y el archivo, y devuelve una
 * URL firmada para que el navegador suba el original directamente a R2.
 */
export async function requestGuestPhotoUploadUseCase(
  input: GuestPhotoUploaderContext & {
    weddingId: string
    claim: GuestPhotoUploaderClaim
    file: { contentType: string; size: number }
    storage: Pick<GuestPhotoStorage, "createSignedUploadUrl">
    createPhotoId: () => string
  },
): Promise<RequestGuestPhotoUploadResult> {
  const extension = guestPhotoExtension(input.file.contentType)

  if (!extension) {
    return { status: "unsupported_type" }
  }

  if (input.file.size <= 0 || input.file.size > GUEST_PHOTO_MAX_BYTES) {
    return { status: "too_large" }
  }

  const uploader = await resolveGuestPhotoUploader(input)

  if (!uploader) {
    return { status: "unknown_uploader" }
  }

  const photoId = input.createPhotoId()
  const keys = guestPhotoKeys(input.weddingId, photoId, extension)
  const uploadUrl = await input.storage.createSignedUploadUrl({
    key: keys.original,
    contentType: input.file.contentType,
    expiresInSeconds: GUEST_PHOTO_UPLOAD_URL_TTL_SECONDS,
  })

  return { status: "ready", photoId, uploadUrl }
}
