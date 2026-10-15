import { getCurrentWeddingId } from "@/composition/current-wedding"
import { mediaPublicUrl } from "@/composition/media-storage"
import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { GuestPhotosModerationView } from "@/domains/guest-photos/adapters/next/components/guest-photos-moderation-view"
import { listWeddingGuestPhotosUseCase } from "@/domains/guest-photos/application/use-cases/list-wedding-guest-photos.use-case"

export async function GuestPhotosModerationPage() {
  const session = await requireAppSession()
  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return null
  }

  const repositories = await getRepositories()
  const photos = await listWeddingGuestPhotosUseCase({
    guestPhotoRepository: repositories.guestPhoto,
    weddingId,
    resolveUrl: mediaPublicUrl,
  })

  return <GuestPhotosModerationView photos={photos} />
}
