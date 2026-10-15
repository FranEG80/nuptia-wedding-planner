import { getGuestPhotoWeddingContext } from "@/domains/guest-photos/adapters/next/guest-photo-context"
import { listGuestPhotosUseCase } from "@/domains/guest-photos/application/use-cases/list-guest-photos.use-case"
import {
  apiErrorResponse,
  withApiErrorHandling,
} from "@/shared/http/api-errors"

async function listGuestPhotos(
  request: Request,
  context: RouteContext<"/api/w/[slug]/photos">,
) {
  const { slug } = await context.params
  const searchParams = new URL(request.url).searchParams
  const cursor = searchParams.get("cursor")
  const limit = Number(searchParams.get("limit"))
  const weddingContext = await getGuestPhotoWeddingContext(slug)

  if (!weddingContext) {
    return apiErrorResponse({
      code: "WEDDING_SITE_NOT_FOUND",
      message: "Web de boda no encontrada",
      status: 404,
    })
  }

  const page = await listGuestPhotosUseCase({
    guestPhotoRepository: weddingContext.repositories.guestPhoto,
    weddingId: weddingContext.weddingId,
    cursor: cursor && cursor.length <= 64 ? cursor : null,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    resolveUrl: weddingContext.resolveUrl,
    photographerCredit: weddingContext.photographerCredit,
  })

  // Sin caché: una foto recién subida tiene que aparecer al recargar.
  return Response.json(page, { headers: { "Cache-Control": "no-store" } })
}

export function GET(request: Request, context: RouteContext<"/api/w/[slug]/photos">) {
  return withApiErrorHandling(
    {
      code: "GUEST_PHOTOS_LIST_FAILED",
      message: "No se pudieron cargar las fotos",
      operation: "guest-photos.list",
    },
    () => listGuestPhotos(request, context),
  )
}
