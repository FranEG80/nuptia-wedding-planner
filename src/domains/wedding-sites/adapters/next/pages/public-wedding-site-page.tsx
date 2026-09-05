import { cache } from "react"
import { notFound } from "next/navigation"

import { getRepositories } from "@/composition/repositories"
import { WeddingSite } from "@/domains/wedding-sites/adapters/next/components/wedding-site"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import {
  createNachoWeddingExperience,
  createWeddingExperienceFromPublicSite,
  NACHO_WEDDING_SLUG,
} from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { weddingSiteThemeFromInvitationDesign } from "@/domains/wedding-sites/application/dtos/wedding-site-theme.dto"
import { DEFAULT_WEDDING_SITE_THEME } from "@/domains/wedding-sites/domain/wedding-site-theme"
import { getPublicWeddingSiteUseCase } from "@/domains/wedding-sites/application/use-cases/get-public-wedding-site.use-case"

export const getPublicWeddingExperience = cache(async (slug: string) => {
  const repositories = await getRepositories()
  const site = await getPublicWeddingSiteUseCase({
    weddingSiteRepository: repositories.weddingSite,
    slug,
  })

  if (site) {
    const design = await getCurrentInvitationDesignUseCase({
      invitationRepository: repositories.invitation,
      weddingId: site.wedding.id,
    })

    return {
      content: createWeddingExperienceFromPublicSite(site),
      theme: weddingSiteThemeFromInvitationDesign(design),
    }
  }

  if (slug !== NACHO_WEDDING_SLUG) {
    return null
  }

  return {
    content: createNachoWeddingExperience(),
    theme: { ...DEFAULT_WEDDING_SITE_THEME, templateId: "maria-daniela" as const },
  }
})

export async function PublicWeddingSitePage({ slug }: { slug: string }) {
  const experience = await getPublicWeddingExperience(slug)

  if (!experience) {
    notFound()
  }

  return <WeddingSite content={experience.content} theme={experience.theme} />
}
