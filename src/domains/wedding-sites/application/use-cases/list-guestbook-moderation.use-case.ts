import {
  toGuestbookModerationSignatureDto,
  type GuestbookModerationSignatureDto,
} from "@/domains/wedding-sites/application/dtos/guestbook.dto"
import type { GuestbookRepository } from "@/domains/wedding-sites/domain/ports/guestbook.repository"

/** Todas las firmas de la boda para el panel de los novios, ocultas incluidas. */
export async function listGuestbookModerationUseCase(input: {
  guestbookRepository: GuestbookRepository
  weddingId: string
}): Promise<GuestbookModerationSignatureDto[]> {
  const signatures = await input.guestbookRepository.listForModeration(input.weddingId)

  return signatures.map(toGuestbookModerationSignatureDto)
}
