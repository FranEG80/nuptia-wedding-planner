import {
  toGuestPhotoModerationDto,
  type GuestPhotoModerationDto,
} from "@/domains/guest-photos/application/dtos/guest-photo-moderation.dto"
import type { GuestPhotoRepository } from "@/domains/guest-photos/domain/ports/guest-photo.repository"

/** Todas las fotos de la boda, publicadas y ocultas, para revisarlas en el panel. */
export async function listWeddingGuestPhotosUseCase(input: {
  guestPhotoRepository: Pick<GuestPhotoRepository, "listByWedding">
  weddingId: string
  resolveUrl: (key: string) => string
}): Promise<GuestPhotoModerationDto[]> {
  const photos = await input.guestPhotoRepository.listByWedding(input.weddingId)

  return photos.map((photo) => toGuestPhotoModerationDto(photo, input.resolveUrl))
}
