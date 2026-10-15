import { SignJWT, jwtVerify } from "jose"
import { z } from "zod"

import { GUEST_PHOTO_MAX_BYTES } from "@/domains/guest-photos/domain/guest-photo-rules"
import { R2MediaObjectStorage } from "@/domains/media/adapters/r2/r2-media-object-storage"
import type {
  CreateSignedUploadUrlInput,
  DirectUploadMediaObjectStorage,
  MediaObjectStorage,
} from "@/domains/media/domain/ports/media-object-storage"

const tokenSchema = z.object({
  key: z.string().regex(/^weddings\/[^/]+\/guest-photos\/[0-9a-f-]{36}\/original\.(jpg|png|webp|avif)$/),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
})
const TOKEN_AUDIENCE = "local-guest-photo-upload"

/** Mantiene el flujo PUT del navegador usando el R2 simulado de Wrangler. */
export class LocalGuestPhotoStorage extends R2MediaObjectStorage implements DirectUploadMediaObjectStorage {
  constructor(bucket: R2Bucket, private readonly secret: string) {
    super(bucket)
  }

  async createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<string> {
    const token = await new SignJWT({ key: input.key, contentType: input.contentType })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience(TOKEN_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${input.expiresInSeconds}s`)
      .sign(new TextEncoder().encode(this.secret))

    return `/api/media/local-upload?token=${encodeURIComponent(token)}`
  }

  async readBytes(key: string): Promise<Uint8Array | null> {
    const object = await this.get(key)
    return object ? new Uint8Array(await new Response(object.body).arrayBuffer()) : null
  }
}

/** El Route Handler solo lo habilita en desarrollo; nunca acepta claves libres. */
export async function handleLocalGuestPhotoUpload(
  request: Request,
  storage: Pick<MediaObjectStorage, "put">,
  secret: string,
): Promise<Response> {
  const url = new URL(request.url)
  const origin = request.headers.get("origin")

  if (origin && origin !== url.origin) {
    return new Response(null, { status: 403 })
  }

  let upload: z.infer<typeof tokenSchema>

  try {
    const { payload } = await jwtVerify(
      url.searchParams.get("token") ?? "",
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"], audience: TOKEN_AUDIENCE, requiredClaims: ["exp"] },
    )
    upload = tokenSchema.parse(payload)
  } catch {
    return new Response(null, { status: 403 })
  }

  if (request.headers.get("content-type") !== upload.contentType) {
    return new Response(null, { status: 415 })
  }

  if (!request.body) {
    return new Response(null, { status: 400 })
  }

  // Se comprueba el tamaño real, incluso sin Content-Length o si es falso.
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > GUEST_PHOTO_MAX_BYTES) {
        await reader.cancel()
        return new Response(null, { status: 413 })
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  if (size === 0) {
    return new Response(null, { status: 400 })
  }

  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  await storage.put({ key: upload.key, contentType: upload.contentType, body })
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } })
}
