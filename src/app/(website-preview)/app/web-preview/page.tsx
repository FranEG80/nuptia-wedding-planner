import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import { WeddingSite } from "@/domains/wedding-sites/adapters/next/components/wedding-site"
import { createWeddingExperienceFromWedding } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { weddingSiteThemeFromInvitationDesign } from "@/domains/wedding-sites/application/dtos/wedding-site-theme.dto"
import { normalizeWeddingSiteTheme } from "@/domains/wedding-sites/domain/wedding-site-theme"
import { listWeddingSiteModulesUseCase } from "@/domains/wedding-sites/application/use-cases/list-wedding-site-modules.use-case"
import type { WeddingSiteModuleType } from "@/domains/wedding-sites/domain/wedding-site-module"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export default async function WeddingWebsitePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ hidden?: string; template?: string }>
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

  const [modules, design, params] = await Promise.all([
    listWeddingSiteModulesUseCase({ weddingSiteRepository: repositories.weddingSite, weddingId: wedding.id }),
    getCurrentInvitationDesignUseCase({ invitationRepository: repositories.invitation, weddingId: wedding.id }),
    searchParams,
  ])
  const hidden = new Set((params.hidden ?? "").split(",").filter(Boolean) as WeddingSiteModuleType[])
  const content = createWeddingExperienceFromWedding(wedding, modules)
  const savedTheme = weddingSiteThemeFromInvitationDesign(design)
  // El editor previsualiza el template seleccionado aunque todavía no se haya guardado.
  const theme = params.template
    ? normalizeWeddingSiteTheme({ ...savedTheme, templateId: params.template })
    : savedTheme

  return (
    <WeddingSite
      content={{ ...content, enabledModules: content.enabledModules.filter((type) => !hidden.has(type)) }}
      theme={theme}
      preview
    />
  )
}
