"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentWeddingId } from "@/composition/current-wedding"
import { getMediaObjectStorage, mediaPublicUrl } from "@/composition/media-storage"
import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { isDemoSession } from "@/core/demo/is-demo-session"
import {
  deleteGuestPhotoUseCase,
  type DeleteGuestPhotoResult,
} from "@/domains/guest-photos/application/use-cases/delete-guest-photo.use-case"
import {
  setGuestPhotoStatusUseCase,
  type SetGuestPhotoStatusResult,
} from "@/domains/guest-photos/application/use-cases/set-guest-photo-status.use-case"
import type { MediaObjectStorage } from "@/domains/media/domain/ports/media-object-storage"
import { reportUnexpectedApiError } from "@/shared/http/api-errors"

const photoIdSchema = z.string().min(1).max(64)

const setStatusSchema = z.object({
  photoId: photoIdSchema,
  status: z.enum(["published", "hidden"]),
})

const deleteSchema = z.object({
  photoId: photoIdSchema,
})

type ModerationActionFailure =
  | { status: "invalid_request" }
  | { status: "read_only" }
  | { status: "not_found" }

export type SetGuestPhotoStatusActionResult =
  | SetGuestPhotoStatusResult
  | ModerationActionFailure

export type DeleteGuestPhotoActionResult =
  | DeleteGuestPhotoResult
  | ModerationActionFailure
  | { status: "unavailable" }

/** Boda del usuario del panel, o el motivo por el que no puede tocar fotos. */
async function resolveModerationWeddingId(): Promise<
  { weddingId: string } | ModerationActionFailure
> {
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return { status: "read_only" }
  }

  const weddingId = await getCurrentWeddingId(session.appUser.id)

  return weddingId ? { weddingId } : { status: "not_found" }
}

/** Los novios ocultan una foto de la galería pública o la vuelven a mostrar. */
export async function setGuestPhotoStatusAction(
  input: unknown,
): Promise<SetGuestPhotoStatusActionResult> {
  const parsed = setStatusSchema.safeParse(input)

  if (!parsed.success) {
    return { status: "invalid_request" }
  }

  const access = await resolveModerationWeddingId()

  if (!("weddingId" in access)) {
    return access
  }

  const repositories = await getRepositories()
  const result = await setGuestPhotoStatusUseCase({
    guestPhotoRepository: repositories.guestPhoto,
    weddingId: access.weddingId,
    photoId: parsed.data.photoId,
    photoStatus: parsed.data.status,
    resolveUrl: mediaPublicUrl,
  })

  // La galería pública no se cachea (no-store): basta con refrescar el panel.
  if (result.status === "updated") {
    revalidatePath("/app/web/fotos")
  }

  return result
}

/** Los novios borran para siempre una foto: la fila y sus archivos en R2. */
export async function deleteGuestPhotoAction(
  input: unknown,
): Promise<DeleteGuestPhotoActionResult> {
  const parsed = deleteSchema.safeParse(input)

  if (!parsed.success) {
    return { status: "invalid_request" }
  }

  const access = await resolveModerationWeddingId()

  if (!("weddingId" in access)) {
    return access
  }

  // Sin bucket no se borra nada: mejor eso que dejar archivos sin fila.
  let storage: MediaObjectStorage

  try {
    storage = getMediaObjectStorage()
  } catch (error) {
    reportUnexpectedApiError("guest-photos.delete.storage", error)
    return { status: "unavailable" }
  }

  const repositories = await getRepositories()
  const result = await deleteGuestPhotoUseCase({
    guestPhotoRepository: repositories.guestPhoto,
    storage,
    weddingId: access.weddingId,
    photoId: parsed.data.photoId,
  })

  if (result.status === "deleted") {
    if (result.failedKeys.length > 0) {
      reportUnexpectedApiError(
        "guest-photos.delete.files",
        new Error(`No se pudieron borrar de R2: ${result.failedKeys.join(", ")}`),
      )
    }

    revalidatePath("/app/web/fotos")
  }

  return result
}
