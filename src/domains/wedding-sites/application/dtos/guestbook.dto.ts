import type {
  GuestbookModerationSignature,
  GuestbookSignature,
  GuestbookSignatureStatus,
} from "@/domains/wedding-sites/domain/guestbook"

export interface GuestbookSignatureDto {
  id: string
  name: string
  message: string
}

/** Una página del tablón tal y como la pinta la web. */
export interface GuestbookPageDto {
  signatures: GuestbookSignatureDto[]
  page: number
  pageCount: number
  total: number
}

export const EMPTY_GUESTBOOK_PAGE: GuestbookPageDto = {
  signatures: [],
  page: 1,
  pageCount: 1,
  total: 0,
}

export function toGuestbookSignatureDto(
  signature: GuestbookSignature,
): GuestbookSignatureDto {
  return { id: signature.id, name: signature.authorName, message: signature.message }
}

/** Firma en el panel de los novios, donde se decide si se ve en la web. */
export interface GuestbookModerationSignatureDto {
  id: string
  authorName: string
  message: string
  guestName: string
  createdAt: string
  status: GuestbookSignatureStatus
}

export function toGuestbookModerationSignatureDto(
  signature: GuestbookModerationSignature,
): GuestbookModerationSignatureDto {
  return {
    id: signature.id,
    authorName: signature.authorName,
    message: signature.message,
    guestName: signature.guestName,
    createdAt: signature.createdAt,
    status: signature.status,
  }
}
