import type {
  GuestbookModerationSignature,
  GuestbookSignature,
  GuestbookSignatureStatus,
} from "@/domains/wedding-sites/domain/guestbook"

export interface CreateGuestbookSignatureInput {
  weddingId: string
  guestId: string
  authorName: string
  message: string
}

export interface GuestbookRepository {
  /** Firmas publicadas de la boda, de la más reciente a la más antigua. */
  listPage(
    weddingId: string,
    range: { offset: number; limit: number },
  ): Promise<{ signatures: GuestbookSignature[]; total: number }>
  create(input: CreateGuestbookSignatureInput): Promise<GuestbookSignature>
  /** Todas las firmas de la boda, ocultas incluidas, de la más reciente a la más antigua. */
  listForModeration(weddingId: string): Promise<GuestbookModerationSignature[]>
  /** Cambia el estado de una firma de la boda. `false` si no existe en esa boda. */
  setStatus(
    weddingId: string,
    signatureId: string,
    status: GuestbookSignatureStatus,
  ): Promise<boolean>
  /** Borra para siempre una firma de la boda. `false` si no existe en esa boda. */
  delete(weddingId: string, signatureId: string): Promise<boolean>
}
