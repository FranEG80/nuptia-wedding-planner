import { cache } from "react"
import { notFound } from "next/navigation"

import { getRepositories } from "@/composition/repositories"
import { env } from "@/core/config/env"
import { WeddingSite } from "@/domains/wedding-sites/adapters/next/components/wedding-site"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import {
  createNachoWeddingExperience,
  createWeddingExperienceFromPublicSite,
  NACHO_WEDDING_SLUG,
} from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { weddingSiteThemeFromInvitationDesign } from "@/domains/wedding-sites/application/dtos/wedding-site-theme.dto"
import { DEFAULT_WEDDING_SITE_THEME } from "@/domains/wedding-sites/domain/wedding-site-theme"
import { isFullWeddingSiteVisible } from "@/domains/wedding-sites/domain/wedding-site-availability"
import { getPublicWeddingSiteUseCase } from "@/domains/wedding-sites/application/use-cases/get-public-wedding-site.use-case"
import { listGuestbookPageUseCase } from "@/domains/wedding-sites/application/use-cases/list-guestbook-page.use-case"

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
      weddingId: site.wedding.id,
      content: createWeddingExperienceFromPublicSite(site),
      theme: weddingSiteThemeFromInvitationDesign(design),
    }
  }

  if (slug !== NACHO_WEDDING_SLUG) {
    return null
  }

  return {
    weddingId: null,
    content: createNachoWeddingExperience(),
    theme: { ...DEFAULT_WEDDING_SITE_THEME, templateId: "maria-daniela" as const },
  }
})

/** Primera página del tablón, servida con la web para que no aparezca vacío. */
async function loadFirstGuestbookPage(weddingId: string) {
  const repositories = await getRepositories()

  return listGuestbookPageUseCase({
    guestbookRepository: repositories.guestbook,
    weddingId,
    page: 1,
  })
}

export async function PublicWeddingSitePage({ slug }: { slug: string }) {
  const experience = await getPublicWeddingExperience(slug)

  if (!experience) {
    notFound()
  }

  const showFullSite = isFullWeddingSiteVisible({
    dateIso: experience.content.dateIso,
    alwaysEnabled: env.WEDDING_SITE_ENABLED,
  })
  const content =
    showFullSite &&
    experience.weddingId &&
    experience.content.enabledModules.includes("guestbook")
      ? {
          ...experience.content,
          guestbook: await loadFirstGuestbookPage(experience.weddingId),
        }
      : experience.content

  return (
    <WeddingSite
      content={content}
      theme={experience.theme}
      showFullSite={showFullSite}
    />
  )
}
