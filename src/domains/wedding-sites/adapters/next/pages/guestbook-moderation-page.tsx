import { getRepositories } from "@/composition/repositories"
import { getCurrentWedding } from "@/composition/current-wedding"
import { requireAppSession } from "@/core/auth"
import { GuestbookModerationView } from "@/domains/wedding-sites/adapters/next/components/guestbook-moderation-view"
import { listGuestbookModerationUseCase } from "@/domains/wedding-sites/application/use-cases/list-guestbook-moderation.use-case"

export async function GuestbookModerationPage() {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const wedding = await getCurrentWedding(session.appUser.id)

  if (!wedding) {
    return null
  }

  const signatures = await listGuestbookModerationUseCase({
    guestbookRepository: repositories.guestbook,
    weddingId: wedding.id,
  })

  return <GuestbookModerationView signatures={signatures} publicUrl={`/w/${wedding.slug}`} />
}
