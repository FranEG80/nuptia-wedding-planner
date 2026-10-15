"use server"

import { z } from "zod"

import { getDirectUploadMediaStorage } from "@/composition/media-storage"
import { getGuestPhotoWeddingContext } from "@/domains/guest-photos/adapters/next/guest-photo-context"
import { sharpGuestPhotoImageProcessor } from "@/domains/guest-photos/adapters/sharp/sharp-guest-photo-image-processor"
import {
  completeGuestPhotoUploadUseCase,
  type CompleteGuestPhotoUploadResult,
} from "@/domains/guest-photos/application/use-cases/complete-guest-photo-upload.use-case"
import {
  requestGuestPhotoUploadUseCase,
  type RequestGuestPhotoUploadResult,
} from "@/domains/guest-photos/application/use-cases/request-guest-photo-upload.use-case"
import { reportUnexpectedApiError } from "@/shared/http/api-errors"

const uploaderSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("guest"), guestId: z.string().min(1).max(100) }),
  z.object({ role: z.literal("photographer"), phone: z.string().min(1).max(40) }),
])

const requestUploadSchema = z.object({
  slug: z.string().min(1).max(200),
  uploader: uploaderSchema,
  contentType: z.string().max(100),
  size: z.number().int().nonnegative(),
})

const completeUploadSchema = z.object({
  slug: z.string().min(1).max(200),
  uploader: uploaderSchema,
  photoId: z.string().max(64),
  contentType: z.string().max(100),
  creditChoice: z.enum(["individual", "party", "custom"]),
  // Se recorta a GUEST_PHOTO_CUSTOM_CREDIT_MAX_LENGTH en el dominio.
  customCredit: z.string().max(200).nullish(),
})

/** Fallos que no dependen de la foto: boda no publicada, R2 sin configurar o error. */
type GuestPhotoActionFailure =
  | { status: "invalid_request" }
  | { status: "unavailable" }
  | { status: "failed" }

export type RequestGuestPhotoUploadActionResult =
  | RequestGuestPhotoUploadResult
  | GuestPhotoActionFailure

export type CompleteGuestPhotoUploadActionResult =
  | CompleteGuestPhotoUploadResult
  | GuestPhotoActionFailure

/**
 * Paso 1 de la subida desde la web pública (sin sesión): devuelve la URL
 * firmada para subir el original directo a R2 desde el navegador.
 */
export async function requestGuestPhotoUploadAction(
  input: unknown,
): Promise<RequestGuestPhotoUploadActionResult> {
  const parsed = requestUploadSchema.safeParse(input)

  if (!parsed.success) {
    return { status: "invalid_request" }
  }

  try {
    const storage = getDirectUploadMediaStorage()
    const context = await getGuestPhotoWeddingContext(parsed.data.slug)

    if (!storage || !context) {
      return { status: "unavailable" }
    }

    return await requestGuestPhotoUploadUseCase({
      weddingId: context.weddingId,
      claim: parsed.data.uploader,
      file: { contentType: parsed.data.contentType, size: parsed.data.size },
      guestRepository: context.repositories.guest,
      photographerPhoneKeys: context.photographerPhoneKeys,
      storage,
      createPhotoId: () => crypto.randomUUID(),
    })
  } catch (error) {
    reportUnexpectedApiError("guest-photos.request-upload", error)
    return { status: "failed" }
  }
}

/**
 * Paso 2: el original ya está en R2. Genera WebP y miniatura y publica la foto.
 */
export async function completeGuestPhotoUploadAction(
  input: unknown,
): Promise<CompleteGuestPhotoUploadActionResult> {
  const parsed = completeUploadSchema.safeParse(input)

  if (!parsed.success) {
    return { status: "invalid_request" }
  }

  try {
    const storage = getDirectUploadMediaStorage()
    const context = await getGuestPhotoWeddingContext(parsed.data.slug)

    if (!storage || !context) {
      return { status: "unavailable" }
    }

    return await completeGuestPhotoUploadUseCase({
      weddingId: context.weddingId,
      claim: parsed.data.uploader,
      photoId: parsed.data.photoId,
      contentType: parsed.data.contentType,
      creditChoice: parsed.data.creditChoice,
      customCredit: parsed.data.customCredit,
      guestRepository: context.repositories.guest,
      photographerPhoneKeys: context.photographerPhoneKeys,
      storage,
      imageProcessor: sharpGuestPhotoImageProcessor,
      guestPhotoRepository: context.repositories.guestPhoto,
      resolveUrl: context.resolveUrl,
      photographerCredit: context.photographerCredit,
    })
  } catch (error) {
    reportUnexpectedApiError("guest-photos.complete-upload", error)
    return { status: "failed" }
  }
}
