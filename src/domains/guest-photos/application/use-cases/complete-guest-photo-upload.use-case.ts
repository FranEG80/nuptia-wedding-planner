import {
  toGuestPhotoDto,
  type GuestPhotoDto,
  type GuestPhotoDtoContext,
} from "@/domains/guest-photos/application/dtos/guest-photo.dto"
import {
  guestPhotoCredit,
  resolveGuestPhotoUploader,
  type GuestPhotoUploaderContext,
} from "@/domains/guest-photos/application/resolve-guest-photo-uploader"
import type {
  GuestPhotoCreditChoice,
  GuestPhotoUploaderClaim,
} from "@/domains/guest-photos/domain/guest-photo"
import {
  GUEST_PHOTO_MAX_BYTES,
  guestPhotoExtension,
  guestPhotoKeys,
  isGuestPhotoId,
} from "@/domains/guest-photos/domain/guest-photo-rules"
import type { GuestPhotoRepository } from "@/domains/guest-photos/domain/ports/guest-photo.repository"
import {
  InvalidGuestPhotoImageError,
  type GuestPhotoImageProcessor,
} from "@/domains/guest-photos/domain/ports/guest-photo-image-processor"
import type { GuestPhotoStorage } from "@/domains/guest-photos/domain/ports/guest-photo-storage"

/** Las claves no se reutilizan: cada versión se puede cachear para siempre. */
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable"

export type CompleteGuestPhotoUploadResult =
  | { status: "published"; photo: GuestPhotoDto }
  | { status: "unknown_uploader" }
  | { status: "unsupported_type" }
  | { status: "not_uploaded" }
  | { status: "too_large" }
  | { status: "invalid_image" }

/**
 * Segundo paso: con el original ya en R2, genera la WebP optimizada y la
 * miniatura, las guarda junto al original y publica la foto en la galería.
 */
export async function completeGuestPhotoUploadUseCase(
  input: GuestPhotoUploaderContext &
    GuestPhotoDtoContext & {
      weddingId: string
      claim: GuestPhotoUploaderClaim
      photoId: string
      contentType: string
      creditChoice: GuestPhotoCreditChoice
      /** Nombre escrito por el invitado cuando `creditChoice` es "custom". */
      customCredit?: string | null
      storage: GuestPhotoStorage
      imageProcessor: GuestPhotoImageProcessor
      guestPhotoRepository: GuestPhotoRepository
    },
): Promise<CompleteGuestPhotoUploadResult> {
  const extension = guestPhotoExtension(input.contentType)

  if (!extension) {
    return { status: "unsupported_type" }
  }

  if (!isGuestPhotoId(input.photoId)) {
    return { status: "not_uploaded" }
  }

  const uploader = await resolveGuestPhotoUploader(input)

  if (!uploader) {
    return { status: "unknown_uploader" }
  }

  // Un reintento del navegador tras un fallo de red no duplica ni borra nada.
  const existing = await input.guestPhotoRepository.findById(input.weddingId, input.photoId)

  if (existing) {
    return { status: "published", photo: toGuestPhotoDto(existing, input) }
  }

  const keys = guestPhotoKeys(input.weddingId, input.photoId, extension)
  const original = await input.storage.readBytes(keys.original)

  if (!original) {
    return { status: "not_uploaded" }
  }

  if (original.byteLength > GUEST_PHOTO_MAX_BYTES) {
    await input.storage.delete(keys.original)
    return { status: "too_large" }
  }

  let processed: Awaited<ReturnType<GuestPhotoImageProcessor["process"]>>

  try {
    processed = await input.imageProcessor.process(original)
  } catch (error) {
    if (error instanceof InvalidGuestPhotoImageError) {
      await input.storage.delete(keys.original)
      return { status: "invalid_image" }
    }

    throw error
  }

  try {
    await Promise.all([
      input.storage.put({
        key: keys.optimized,
        body: processed.optimized.bytes,
        contentType: processed.optimized.contentType,
        cacheControl: IMMUTABLE_CACHE_CONTROL,
      }),
      input.storage.put({
        key: keys.thumbnail,
        body: processed.thumbnail.bytes,
        contentType: processed.thumbnail.contentType,
        cacheControl: IMMUTABLE_CACHE_CONTROL,
      }),
    ])

    const photo = await input.guestPhotoRepository.create({
      id: input.photoId,
      weddingId: input.weddingId,
      guestId: uploader.role === "guest" ? uploader.identity.id : null,
      uploaderRole: uploader.role,
      uploaderPhone: uploader.role === "photographer" ? uploader.phone : null,
      credit: guestPhotoCredit(uploader, input.creditChoice, input.customCredit),
      originalKey: keys.original,
      optimizedKey: keys.optimized,
      thumbnailKey: keys.thumbnail,
      contentType: input.contentType,
      originalBytes: original.byteLength,
      width: processed.optimized.width,
      height: processed.optimized.height,
    })

    return { status: "published", photo: toGuestPhotoDto(photo, input) }
  } catch (error) {
    // El original se queda: el navegador puede reintentar este mismo paso.
    await Promise.all([
      input.storage.delete(keys.optimized).catch(() => undefined),
      input.storage.delete(keys.thumbnail).catch(() => undefined),
    ])
    throw error
  }
}
