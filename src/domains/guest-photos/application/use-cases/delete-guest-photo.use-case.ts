import type { GuestPhotoRepository } from "@/domains/guest-photos/domain/ports/guest-photo.repository"
import type { GuestPhotoStorage } from "@/domains/guest-photos/domain/ports/guest-photo-storage"

export type DeleteGuestPhotoResult =
  | { status: "deleted"; photoId: string; failedKeys: string[] }
  | { status: "not_found" }

/**
 * Borra para siempre una foto de la boda: la fila y sus tres versiones en R2.
 * La fila va primero: si R2 falla, la foto ya no sale en la galería y solo
 * quedan archivos huérfanos (se devuelven en failedKeys para avisar).
 */
export async function deleteGuestPhotoUseCase(input: {
  guestPhotoRepository: Pick<GuestPhotoRepository, "findById" | "delete">
  storage: Pick<GuestPhotoStorage, "delete">
  weddingId: string
  photoId: string
}): Promise<DeleteGuestPhotoResult> {
  const photo = await input.guestPhotoRepository.findById(input.weddingId, input.photoId)

  if (!photo) {
    return { status: "not_found" }
  }

  const deleted = await input.guestPhotoRepository.delete({
    weddingId: input.weddingId,
    id: photo.id,
  })

  if (!deleted) {
    return { status: "not_found" }
  }

  const keys = [photo.originalKey, photo.optimizedKey, photo.thumbnailKey]
  const results = await Promise.allSettled(keys.map((key) => input.storage.delete(key)))

  return {
    status: "deleted",
    photoId: photo.id,
    failedKeys: keys.filter((_, index) => results[index].status === "rejected"),
  }
}
