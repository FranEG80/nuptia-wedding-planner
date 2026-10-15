import { getCloudflareContext } from "@opennextjs/cloudflare"

import { env } from "@/core/config/env"
import { handleLocalGuestPhotoUpload } from "@/domains/guest-photos/adapters/r2/local-guest-photo-storage"
import { R2MediaObjectStorage } from "@/domains/media/adapters/r2/r2-media-object-storage"
import { withApiErrorHandling } from "@/shared/http/api-errors"

export function PUT(request: Request) {
  if (process.env.NODE_ENV !== "development" || process.env.VERCEL === "1") {
    return new Response(null, { status: 404 })
  }

  return withApiErrorHandling({ operation: "guest-photos.local-upload" }, () => {
    const { env: cloudflareEnv } = getCloudflareContext()
    return handleLocalGuestPhotoUpload(
      request,
      new R2MediaObjectStorage(cloudflareEnv.MEDIA_BUCKET),
      env.BETTER_AUTH_SECRET,
    )
  })
}
