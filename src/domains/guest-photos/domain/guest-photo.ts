export type GuestPhotoUploaderRole = "guest" | "photographer"
export type GuestPhotoStatus = "published" | "hidden"

export interface GuestPhoto {
  id: string
  weddingId: string
  /** Null en las fotos de fotógrafo o si se borró la invitación. */
  guestId: string | null
  uploaderRole: GuestPhotoUploaderRole
  uploaderPhone: string | null
  /** Nombre fijado al subirla. Null en las de fotógrafo. */
  credit: string | null
  originalKey: string
  optimizedKey: string
  thumbnailKey: string
  contentType: string
  originalBytes: number
  /** Medidas de la versión optimizada. */
  width: number
  height: number
  status: GuestPhotoStatus
  createdAt: string
}

/** Quién dice ser el que sube, tal y como llega del navegador. */
export type GuestPhotoUploaderClaim =
  | { role: "guest"; guestId: string }
  | { role: "photographer"; phone: string }

/**
 * Con qué nombre firma un invitado: el suyo, el de su invitación o uno que
 * escribe él mismo ("custom", con el texto aparte).
 */
export type GuestPhotoCreditChoice = "individual" | "party" | "custom"
