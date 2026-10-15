import {
  toGuestPhotoDto,
  type GuestPhotoDtoContext,
  type GuestPhotoPageDto,
} from "@/domains/guest-photos/application/dtos/guest-photo.dto"
import {
  GUEST_PHOTO_MAX_PAGE_SIZE,
  GUEST_PHOTO_PAGE_SIZE,
} from "@/domains/guest-photos/domain/guest-photo-rules"
import type { GuestPhotoRepository } from "@/domains/guest-photos/domain/ports/guest-photo.repository"

export async function listGuestPhotosUseCase(
  input: GuestPhotoDtoContext & {
    guestPhotoRepository: Pick<GuestPhotoRepository, "listPublished" | "countPublished">
    weddingId: string
    cursor: string | null
    limit?: number
  },
): Promise<GuestPhotoPageDto> {
  const limit = Math.min(
    Math.max(Math.trunc(input.limit ?? GUEST_PHOTO_PAGE_SIZE), 1),
    GUEST_PHOTO_MAX_PAGE_SIZE,
  )
  const [page, total] = await Promise.all([
    input.guestPhotoRepository.listPublished({
      weddingId: input.weddingId,
      cursor: input.cursor,
      limit,
    }),
    // El total solo se cuenta una vez: el navegador lo suma al subir fotos.
    input.cursor ? null : input.guestPhotoRepository.countPublished(input.weddingId),
  ])

  return {
    photos: page.photos.map((photo) => toGuestPhotoDto(photo, input)),
    nextCursor: page.nextCursor,
    total,
  }
}
