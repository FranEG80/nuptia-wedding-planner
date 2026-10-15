/** Tamaño máximo del original. Las fotos de móvil rondan 2-12 MB. */
export const GUEST_PHOTO_MAX_BYTES = 25 * 1024 * 1024

/** Minutos que vale la URL firmada para subir el original a R2. */
export const GUEST_PHOTO_UPLOAD_URL_TTL_SECONDS = 15 * 60

/** Largo máximo del nombre que escribe el invitado: cabe en la polaroid. */
export const GUEST_PHOTO_CUSTOM_CREDIT_MAX_LENGTH = 60

/** Nombre escrito por el invitado, sin espacios de más; vacío = null. */
export function normalizeCustomCredit(value: string | null | undefined): string | null {
  const name = (value ?? "").replace(/\s+/g, " ").trim()
  return name ? name.slice(0, GUEST_PHOTO_CUSTOM_CREDIT_MAX_LENGTH).trim() : null
}

export const GUEST_PHOTO_PAGE_SIZE = 24
export const GUEST_PHOTO_MAX_PAGE_SIZE = 60

/**
 * Formatos que se aceptan como original. HEIC no: el iPhone lo convierte a JPEG
 * al elegir la foto desde la web, y sharp no sabe leerlo.
 */
const GUEST_PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}

export function guestPhotoExtension(contentType: string): string | null {
  return GUEST_PHOTO_EXTENSIONS[contentType] ?? null
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** El id de la foto lo genera el servidor; el navegador lo devuelve al terminar. */
export function isGuestPhotoId(value: string) {
  return UUID_PATTERN.test(value)
}

/** Claves en R2 de las tres versiones de una foto. */
export function guestPhotoKeys(weddingId: string, photoId: string, extension: string) {
  const base = `weddings/${weddingId}/guest-photos/${photoId}`

  return {
    original: `${base}/original.${extension}`,
    optimized: `${base}/optimized.webp`,
    thumbnail: `${base}/thumbnail.webp`,
  }
}
