import {
  GUEST_PHOTO_MAX_BYTES,
  guestPhotoExtension,
} from "@/domains/guest-photos/domain/guest-photo-rules"

type PreparationFailure = "too_large" | "unsupported_type" | "conversion_failed"
type HeicConverter = (file: File) => Promise<Blob>

export class GuestPhotoPreparationError extends Error {
  constructor(readonly reason: PreparationFailure, options?: ErrorOptions) {
    super(reason, options)
    this.name = "GuestPhotoPreparationError"
  }
}

async function convertHeic(file: File): Promise<Blob> {
  // El decodificador usa un worker y solo se descarga si llega un HEIC real.
  const { heicTo } = await import("heic-to/csp")
  return heicTo({ blob: file, type: "image/jpeg", quality: 0.92 })
}

function checkSize(file: Blob) {
  if (file.size === 0 || file.size > GUEST_PHOTO_MAX_BYTES) {
    throw new GuestPhotoPreparationError("too_large")
  }
}

/** Evita reconvertir los JPEG que el selector de iOS entrega con nombre .HEIC. */
function imageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes[0] === 0x89 && String.fromCharCode(...bytes.slice(1, 4)) === "PNG") return "image/png"
  const text = new TextDecoder("ascii").decode(bytes)
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP") return "image/webp"
  if (text.slice(4, 8) === "ftyp") {
    const brands = [text.slice(8, 12)]
    for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
      brands.push(text.slice(offset, offset + 4))
    }
    // AVIF también puede declarar mif1 como marca compatible.
    if (brands.some((brand) => brand === "avif" || brand === "avis")) return "image/avif"
    if (brands.some((brand) => /^(heic|heix|hevc|hevx|mif1|msf1)$/.test(brand))) return "image/heic"
  }
  return null
}

/** Se llama en serie desde el selector para no decodificar varias fotos grandes a la vez. */
export async function prepareGuestPhoto(
  file: File,
  convert: HeicConverter = convertHeic,
): Promise<File> {
  checkSize(file)
  const detectedType = imageType(new Uint8Array(await file.slice(0, 64).arrayBuffer()))
  const isHeic = detectedType === "image/heic" || (!detectedType && (
    /^image\/hei[cf](?:-sequence)?$/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
  ))

  if (!isHeic) {
    const type = detectedType ?? file.type
    if (!guestPhotoExtension(type)) throw new GuestPhotoPreparationError("unsupported_type")
    if (type === file.type) return file
    return new File([file], file.name, { type, lastModified: file.lastModified })
  }

  let jpeg: Blob
  try {
    jpeg = await convert(file)
    if (jpeg.type !== "image/jpeg" || jpeg.size === 0) throw new Error("JPEG vacío o inválido")
  } catch (cause) {
    throw new GuestPhotoPreparationError("conversion_failed", { cause })
  }
  // El JPEG puede ocupar más que el HEIC: se valida antes de pedir una URL de R2.
  checkSize(jpeg)
  const name = file.name.replace(/\.[^.]+$/, "") || "foto"
  return new File([jpeg], `${name}.jpg`, { type: "image/jpeg", lastModified: file.lastModified })
}
