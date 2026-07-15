import { randomUUID } from "node:crypto"

import { getMediaObjectStorage } from "@/composition/media-storage"
import { getRepositories } from "@/composition/repositories"
import { getCurrentAppSession } from "@/core/auth"
import { env } from "@/core/config/env"
import { createMediaAssetUseCase } from "@/domains/media/application/use-cases/create-media-asset.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

const imageExtensions: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = request.headers.get("origin")

  if (origin && origin !== requestUrl.origin) {
    return jsonError("Origen no permitido", 403)
  }

  const appSession = await getCurrentAppSession()

  if (!appSession) {
    return jsonError("Autenticación requerida", 401)
  }

  const repositories = await getRepositories()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: appSession.appUser.id,
  })

  if (!wedding) {
    return jsonError("Boda no encontrada", 404)
  }

  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return jsonError("Formulario de subida no válido", 400)
  }

  const file = formData.get("file")

  if (!(file instanceof File)) {
    return jsonError("Falta el campo file", 400)
  }

  const extension = imageExtensions[file.type]

  if (!extension) {
    return jsonError("Formato de imagen no permitido", 415)
  }

  if (file.size === 0 || file.size > env.R2_MAX_UPLOAD_BYTES) {
    return jsonError(
      `La imagen debe ocupar entre 1 byte y ${env.R2_MAX_UPLOAD_BYTES} bytes`,
      413,
    )
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
    console.error("Media upload failed", error)
    return jsonError("No se pudo guardar la imagen", 500)
  }
}
