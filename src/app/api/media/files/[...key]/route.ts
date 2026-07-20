import { getMediaObjectStorage } from "@/composition/media-storage"
import { reportUnexpectedApiError } from "@/shared/http/api-errors"

type MediaFileContext = {
  params: Promise<{ key: string[] }>
}

async function readMediaObject(
  request: Request,
  context: MediaFileContext,
  includeBody: boolean,
) {
  const { key: keyParts } = await context.params
  const key = keyParts.join("/")

  if (!key.startsWith("weddings/") || keyParts.some((part) => part === "..")) {
    return new Response(null, { status: 404 })
  }

  const object = await getMediaObjectStorage().get(key)

  if (!object) {
    return new Response(null, { status: 404 })
  }

  if (request.headers.get("if-none-match") === object.etag) {
    return new Response(null, { status: 304, headers: { ETag: object.etag } })
  }

  const headers = new Headers({
    "Cache-Control": object.cacheControl ?? "public, max-age=31536000, immutable",
    ETag: object.etag,
    "X-Content-Type-Options": "nosniff",
  })

  if (object.contentType) {
    headers.set("Content-Type", object.contentType)
  }

  return new Response(includeBody ? object.body : null, { headers })
}

export function GET(request: Request, context: MediaFileContext) {
  return safelyReadMediaObject(request, context, true)
}

export function HEAD(request: Request, context: MediaFileContext) {
  return safelyReadMediaObject(request, context, false)
}

async function safelyReadMediaObject(
  request: Request,
  context: MediaFileContext,
  includeBody: boolean,
) {
  try {
    return await readMediaObject(request, context, includeBody)
  } catch (error) {
    const requestId = reportUnexpectedApiError("media.files.read", error)

    return new Response(null, {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": requestId,
      },
    })
  }
}
