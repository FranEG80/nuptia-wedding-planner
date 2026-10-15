import type {
  GuestPhoto,
  GuestPhotoStatus,
} from "@/domains/guest-photos/domain/guest-photo"

export type CreateGuestPhotoInput = Omit<GuestPhoto, "status" | "createdAt">

export interface GuestPhotoPage {
  photos: GuestPhoto[]
  /** Id de la última foto de la página, o null si no hay más. */
  nextCursor: string | null
}

export interface GuestPhotoRepository {
  create(input: CreateGuestPhotoInput): Promise<GuestPhoto>
  findById(weddingId: string, id: string): Promise<GuestPhoto | null>
  countPublished(weddingId: string): Promise<number>
  /** Fotos publicadas, de la más reciente a la más antigua. */
  listPublished(input: {
    weddingId: string
    cursor: string | null
    limit: number
  }): Promise<GuestPhotoPage>
  /** Todas las fotos de la boda, también las ocultas, de la más reciente a la más antigua. */
  listByWedding(weddingId: string): Promise<GuestPhoto[]>
  /** Cambia el estado solo si la foto es de esa boda; null si no lo es. */
  updateStatus(input: {
    weddingId: string
    id: string
    status: GuestPhotoStatus
  }): Promise<GuestPhoto | null>
  /** Borra la fila solo si la foto es de esa boda; false si no lo es. */
  delete(input: { weddingId: string; id: string }): Promise<boolean>
}
