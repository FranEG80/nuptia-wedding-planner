import { getMediaObjectStorage } from "@/composition/media-storage"

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
  return readMediaObject(request, context, true)
}

export function HEAD(request: Request, context: MediaFileContext) {
  return readMediaObject(request, context, false)
}
