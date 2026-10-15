export interface ProcessedGuestPhotoImage {
  bytes: Uint8Array<ArrayBuffer>
  width: number
  height: number
  contentType: "image/webp"
}

export interface ProcessedGuestPhoto {
  /** Versión para el visor: lado largo acotado. */
  optimized: ProcessedGuestPhotoImage
  /** Miniatura cuadrada para la parrilla de polaroids. */
  thumbnail: ProcessedGuestPhotoImage
}

export interface GuestPhotoImageProcessor {
  /** Lanza InvalidGuestPhotoImageError si el archivo no es una imagen legible. */
  process(original: Uint8Array): Promise<ProcessedGuestPhoto>
}

export class InvalidGuestPhotoImageError extends Error {
  constructor(cause?: unknown) {
    super("El archivo no es una imagen válida", { cause })
    this.name = "InvalidGuestPhotoImageError"
  }
}
