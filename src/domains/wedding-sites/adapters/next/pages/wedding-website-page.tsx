import { requireAppSession } from "@/core/auth"
import { repositories } from "@/composition/repositories"
import { getPublicWeddingSiteUseCase } from "@/domains/wedding-sites/application/use-cases/get-public-wedding-site.use-case"
import { listWeddingSiteModulesUseCase } from "@/domains/wedding-sites/application/use-cases/list-wedding-site-modules.use-case"
import { WebsiteView } from "@/domains/wedding-sites/adapters/next/components/website-view"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export async function WeddingWebsitePage() {
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const [modules, publicSite] = await Promise.all([
    listWeddingSiteModulesUseCase({
      weddingSiteRepository: repositories.weddingSite,
      weddingId: wedding.id,
    }),
    getPublicWeddingSiteUseCase({
      weddingSiteRepository: repositories.weddingSite,
      slug: wedding.slug,
    }),
  ])

  if (!publicSite) {
    return null
  }

  return <WebsiteView modules={modules} publicSite={publicSite} />
}
