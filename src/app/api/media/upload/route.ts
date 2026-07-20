import { randomUUID } from "node:crypto"

import { getMediaObjectStorage } from "@/composition/media-storage"
import { getRepositories } from "@/composition/repositories"
import { getCurrentAppSession } from "@/core/auth"
import { env } from "@/core/config/env"
import { isDemoSession } from "@/core/demo/is-demo-session"
import { createMediaAssetUseCase } from "@/domains/media/application/use-cases/create-media-asset.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"
import {
  apiErrorResponse,
  withApiErrorHandling,
} from "@/shared/http/api-errors"

const imageExtensions: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

async function uploadMedia(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = request.headers.get("origin")

  if (origin && origin !== requestUrl.origin) {
    return apiErrorResponse({
      code: "ORIGIN_NOT_ALLOWED",
      message: "Origen no permitido",
      status: 403,
    })
  }

  const appSession = await getCurrentAppSession()

  if (!appSession) {
    return apiErrorResponse({
      code: "AUTHENTICATION_REQUIRED",
      message: "Autenticación requerida",
      status: 401,
    })
  }

  if (isDemoSession(appSession)) {
    return apiErrorResponse({
      code: "DEMO_ACCOUNT_READ_ONLY",
      message: "La cuenta demo no permite subir archivos",
      status: 403,
    })
  }

  const repositories = await getRepositories()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: appSession.appUser.id,
  })

  if (!wedding) {
    return apiErrorResponse({
      code: "WEDDING_NOT_FOUND",
      message: "Boda no encontrada",
      status: 404,
    })
  }

  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return apiErrorResponse({
      code: "INVALID_UPLOAD_FORM",
      message: "Formulario de subida no válido",
      status: 400,
    })
  }

  const file = formData.get("file")

  if (!(file instanceof File)) {
    return apiErrorResponse({
      code: "FILE_REQUIRED",
      message: "Falta el campo file",
      status: 400,
    })
  }

  const extension = imageExtensions[file.type]

  if (!extension) {
    return apiErrorResponse({
      code: "UNSUPPORTED_IMAGE_FORMAT",
      message: "Formato de imagen no permitido",
      status: 415,
    })
  }

  if (file.size === 0 || file.size > env.R2_MAX_UPLOAD_BYTES) {
    return apiErrorResponse({
      code: "INVALID_IMAGE_SIZE",
      message: `La imagen debe ocupar entre 1 byte y ${env.R2_MAX_UPLOAD_BYTES} bytes`,
      status: 413,
    })
  }

  const altValue = formData.get("alt")
  const alt = typeof altValue === "string" ? altValue.trim().slice(0, 300) : null
  const key = `weddings/${wedding.id}/${randomUUID()}.${extension}`
  const storage = getMediaObjectStorage()

  try {
    await storage.put({
      key,
      body: file.stream(),
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    })

    const encodedKey = key.split("/").map(encodeURIComponent).join("/")
    const asset = await createMediaAssetUseCase({
      mediaRepository: repositories.media,
      weddingId: wedding.id,
      data: {
        type: "image",
        provider: "r2",
        key,
        url: `${requestUrl.origin}/api/media/files/${encodedKey}`,
        alt: alt || null,
      },
    })

    return Response.json(asset, { status: 201 })
  } catch (error) {
    await storage.delete(key).catch(() => undefined)
    throw error
  }
}

export function POST(request: Request) {
  return withApiErrorHandling(
    {
      code: "MEDIA_UPLOAD_FAILED",
      message: "No se pudo guardar la imagen",
      operation: "media.upload",
    },
    () => uploadMedia(request),
  )
}
