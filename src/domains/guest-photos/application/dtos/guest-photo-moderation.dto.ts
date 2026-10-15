import type {
  GuestPhoto,
  GuestPhotoStatus,
  GuestPhotoUploaderRole,
} from "@/domains/guest-photos/domain/guest-photo"

/** Foto tal y como la revisan los novios en el panel. */
export interface GuestPhotoModerationDto {
  id: string
  /** Miniatura cuadrada WebP. */
  thumbnailUrl: string
  /** Versión optimizada WebP, para verla en grande. */
  url: string
  /** Nombre con el que firmó el invitado. Null en las de fotógrafo. */
  credit: string | null
  uploaderRole: GuestPhotoUploaderRole
  status: GuestPhotoStatus
  createdAt: string
}

export function toGuestPhotoModerationDto(
  photo: GuestPhoto,
  resolveUrl: (key: string) => string,
): GuestPhotoModerationDto {
  return {
    id: photo.id,
    thumbnailUrl: resolveUrl(photo.thumbnailKey),
    url: resolveUrl(photo.optimizedKey),
    credit: photo.credit,
    uploaderRole: photo.uploaderRole,
    status: photo.status,
    createdAt: photo.createdAt,
  }
}
