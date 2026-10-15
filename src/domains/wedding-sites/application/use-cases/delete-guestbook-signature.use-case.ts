import type { GuestbookRepository } from "@/domains/wedding-sites/domain/ports/guestbook.repository"

/**
 * Borra una firma para siempre. Solo toca firmas de la boda indicada: `false`
 * si la firma no existe o es de otra boda.
 */
export async function deleteGuestbookSignatureUseCase(input: {
  guestbookRepository: GuestbookRepository
  weddingId: string
  signatureId: string
}): Promise<boolean> {
  return input.guestbookRepository.delete(input.weddingId, input.signatureId)
}
