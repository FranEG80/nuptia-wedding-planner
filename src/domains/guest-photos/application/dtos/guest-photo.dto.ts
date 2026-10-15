import type { GuestPhoto } from "@/domains/guest-photos/domain/guest-photo"

/** Foto tal y como la pinta la galería pública. */
export interface GuestPhotoDto {
  id: string
  /** Miniatura cuadrada WebP para la polaroid. */
  thumbnailUrl: string
  /** Versión optimizada WebP para el visor. */
  url: string
  width: number
  height: number
  /** Nombre que se escribe en la polaroid; null = sin nombre. */
  credit: string | null
}

export interface GuestPhotoPageDto {
  photos: GuestPhotoDto[]
  nextCursor: string | null
  /** Total de fotos publicadas. Solo viene en la primera página. */
  total: number | null
}

export interface GuestPhotoDtoContext {
  /** URL pública de una clave del bucket. */
  resolveUrl: (key: string) => string
  /** Nombre para las fotos de fotógrafo (los novios o ninguno). */
  photographerCredit: string | null
}

export function toGuestPhotoDto(
  photo: GuestPhoto,
  context: GuestPhotoDtoContext,
): GuestPhotoDto {
  return {
    id: photo.id,
    thumbnailUrl: context.resolveUrl(photo.thumbnailKey),
    url: context.resolveUrl(photo.optimizedKey),
    width: photo.width,
    height: photo.height,
    credit:
      photo.uploaderRole === "photographer" ? context.photographerCredit : photo.credit,
  }
}
