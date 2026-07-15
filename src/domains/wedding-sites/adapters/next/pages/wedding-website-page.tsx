import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { WebsiteView } from "@/domains/wedding-sites/adapters/next/components/website-view"
import { createWeddingExperienceFromWedding } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { listWeddingSiteModulesUseCase } from "@/domains/wedding-sites/application/use-cases/list-wedding-site-modules.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export async function WeddingWebsitePage() {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const modules = await listWeddingSiteModulesUseCase({
    weddingSiteRepository: repositories.weddingSite,
    weddingId: wedding.id,
  })
  const experience = createWeddingExperienceFromWedding(wedding, modules)

  return <WebsiteView modules={modules} experience={experience} />
}
