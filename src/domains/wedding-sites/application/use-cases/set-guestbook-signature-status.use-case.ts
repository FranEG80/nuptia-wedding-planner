import type { GuestbookSignatureStatus } from "@/domains/wedding-sites/domain/guestbook"
import type { GuestbookRepository } from "@/domains/wedding-sites/domain/ports/guestbook.repository"

/**
 * Oculta una firma del tablón o la vuelve a publicar. Solo toca firmas de la
 * boda indicada: `false` si la firma no existe o es de otra boda.
 */
export async function setGuestbookSignatureStatusUseCase(input: {
  guestbookRepository: GuestbookRepository
  weddingId: string
  signatureId: string
  status: GuestbookSignatureStatus
}): Promise<boolean> {
  return input.guestbookRepository.setStatus(
    input.weddingId,
    input.signatureId,
    input.status,
  )
}
