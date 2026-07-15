import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { WeddingExperience } from "@/domains/wedding-sites/adapters/next/components/wedding-experience"
import { createWeddingExperienceFromWedding } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { listWeddingSiteModulesUseCase } from "@/domains/wedding-sites/application/use-cases/list-wedding-site-modules.use-case"
import type { WeddingSiteModuleType } from "@/domains/wedding-sites/domain/wedding-site-module"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export default async function WeddingWebsitePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ hidden?: string }>
}) {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const [modules, params] = await Promise.all([
    listWeddingSiteModulesUseCase({ weddingSiteRepository: repositories.weddingSite, weddingId: wedding.id }),
    searchParams,
  ])
  const hidden = new Set((params.hidden ?? "").split(",").filter(Boolean) as WeddingSiteModuleType[])
  const content = createWeddingExperienceFromWedding(wedding, modules)

  return (
    <WeddingExperience
      content={{ ...content, enabledModules: content.enabledModules.filter((type) => !hidden.has(type)) }}
      preview
    />
  )
}
