import {
  toGuestbookSignatureDto,
  type GuestbookSignatureDto,
} from "@/domains/wedding-sites/application/dtos/guestbook.dto"
import {
  GUESTBOOK_AUTHOR_MAX_LENGTH,
  GUESTBOOK_MESSAGE_MAX_LENGTH,
  normalizeGuestbookAuthorName,
  normalizeGuestbookMessage,
} from "@/domains/wedding-sites/domain/guestbook"
import type { GuestbookRepository } from "@/domains/wedding-sites/domain/ports/guestbook.repository"

/** Invitado que firma. `null` si el guestId no pertenece a la boda. */
export type FindGuestbookSigner = (
  weddingId: string,
  guestId: string,
) => Promise<{ firstName: string } | null>

export type SignGuestbookResult =
  | { status: "signed"; signature: GuestbookSignatureDto }
  | { status: "empty_message" }
  | { status: "message_too_long" }
  | { status: "unknown_guest" }

/**
 * Cuelga una firma en el tablón. El guestId llega del navegador (se guardó al
 * validar el teléfono), así que se comprueba que sea un invitado de la boda.
 * Sin nombre de firma, firma con su nombre de pila.
 */
export async function signGuestbookUseCase(input: {
  guestbookRepository: GuestbookRepository
  findSigner: FindGuestbookSigner
  weddingId: string
  guestId: string
  authorName: string
  message: string
}): Promise<SignGuestbookResult> {
  const message = normalizeGuestbookMessage(input.message)

  if (!message) {
    return { status: "empty_message" }
  }

  if (message.length > GUESTBOOK_MESSAGE_MAX_LENGTH) {
    return { status: "message_too_long" }
  }

  const signer = await input.findSigner(input.weddingId, input.guestId)

  if (!signer) {
    return { status: "unknown_guest" }
  }

  const authorName =
    normalizeGuestbookAuthorName(input.authorName).slice(0, GUESTBOOK_AUTHOR_MAX_LENGTH) ||
    normalizeGuestbookAuthorName(signer.firstName)
  const signature = await input.guestbookRepository.create({
    weddingId: input.weddingId,
    guestId: input.guestId,
    authorName,
    message,
  })

  return { status: "signed", signature: toGuestbookSignatureDto(signature) }
}
