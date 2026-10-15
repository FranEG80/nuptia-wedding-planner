import {
  toGuestPhotoModerationDto,
  type GuestPhotoModerationDto,
} from "@/domains/guest-photos/application/dtos/guest-photo-moderation.dto"
import type { GuestPhotoStatus } from "@/domains/guest-photos/domain/guest-photo"
import type { GuestPhotoRepository } from "@/domains/guest-photos/domain/ports/guest-photo.repository"

export type SetGuestPhotoStatusResult =
  | { status: "updated"; photo: GuestPhotoModerationDto }
  | { status: "not_found" }

/**
 * Oculta una foto de la galería pública o la vuelve a mostrar. Solo cambia el
 * estado: la fila y los archivos de R2 se quedan como estaban.
 */
export async function setGuestPhotoStatusUseCase(input: {
  guestPhotoRepository: Pick<GuestPhotoRepository, "findById" | "updateStatus">
  weddingId: string
  photoId: string
  photoStatus: GuestPhotoStatus
  resolveUrl: (key: string) => string
}): Promise<SetGuestPhotoStatusResult> {
  const photo = await input.guestPhotoRepository.findById(input.weddingId, input.photoId)

  if (!photo) {
    return { status: "not_found" }
  }

  const updated =
    photo.status === input.photoStatus
      ? photo
      : await input.guestPhotoRepository.updateStatus({
          weddingId: input.weddingId,
          id: photo.id,
          status: input.photoStatus,
        })

  if (!updated) {
    return { status: "not_found" }
  }

  return {
    status: "updated",
    photo: toGuestPhotoModerationDto(updated, input.resolveUrl),
  }
}
