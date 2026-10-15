import sharp, { type OutputInfo } from "sharp"

import {
  InvalidGuestPhotoImageError,
  type GuestPhotoImageProcessor,
  type ProcessedGuestPhotoImage,
} from "@/domains/guest-photos/domain/ports/guest-photo-image-processor"

/** Lado largo de la versión del visor: nítida en pantallas retina grandes. */
const OPTIMIZED_MAX_EDGE = 2048
const OPTIMIZED_QUALITY = 82
/** Miniatura cuadrada: cubre una polaroid de ~320 px a densidad 2x. */
const THUMBNAIL_EDGE = 640
const THUMBNAIL_QUALITY = 74
/** Unos 100 MP: cualquier móvil actual entra; evita archivos trampa enormes. */
const MAX_INPUT_PIXELS = 100_000_000

function toProcessedImage(output: {
  data: Uint8Array<ArrayBuffer>
  info: OutputInfo
}): ProcessedGuestPhotoImage {
  return {
    bytes: output.data,
    width: output.info.width,
    height: output.info.height,
    contentType: "image/webp",
  }
}

/**
 * WebP optimizada y miniatura con sharp. Endereza la foto según su EXIF y no
 * copia metadatos (fuera ubicación GPS y datos de la cámara).
 */
export const sharpGuestPhotoImageProcessor: GuestPhotoImageProcessor = {
  async process(original) {
    const source = sharp(original, {
      autoOrient: true,
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    })

    try {
      const metadata = await source.metadata()

      if (!metadata.width || !metadata.height) {
        throw new Error("Imagen sin dimensiones")
      }

      const [optimized, thumbnail] = await Promise.all([
        source
          .clone()
          .resize({
            width: OPTIMIZED_MAX_EDGE,
            height: OPTIMIZED_MAX_EDGE,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: OPTIMIZED_QUALITY })
          .toBuffer({ resolveWithObject: true }),
        source
          .clone()
          .resize({
            width: THUMBNAIL_EDGE,
            height: THUMBNAIL_EDGE,
            fit: "cover",
            // Encuadra hacia caras y zonas con detalle, no al centro a ciegas.
            position: sharp.strategy.attention,
          })
          .webp({ quality: THUMBNAIL_QUALITY })
          .toBuffer({ resolveWithObject: true }),
      ])

      return {
        optimized: toProcessedImage(optimized),
        thumbnail: toProcessedImage(thumbnail),
      }
    } catch (error) {
      throw new InvalidGuestPhotoImageError(error)
    }
  },
}
