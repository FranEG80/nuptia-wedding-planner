import { cache } from "react"
import { notFound } from "next/navigation"

import { getRepositories } from "@/composition/repositories"
import { WeddingExperience } from "@/domains/wedding-sites/adapters/next/components/wedding-experience"
import {
  createNachoWeddingExperience,
  createWeddingExperienceFromPublicSite,
  NACHO_WEDDING_SLUG,
} from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { getPublicWeddingSiteUseCase } from "@/domains/wedding-sites/application/use-cases/get-public-wedding-site.use-case"

export const getPublicWeddingExperience = cache(async (slug: string) => {
  const repositories = await getRepositories()
  const site = await getPublicWeddingSiteUseCase({
    weddingSiteRepository: repositories.weddingSite,
    slug,
  })

  if (site) {
    return createWeddingExperienceFromPublicSite(site)
  }

  return slug === NACHO_WEDDING_SLUG ? createNachoWeddingExperience() : null
})

export async function PublicWeddingSitePage({ slug }: { slug: string }) {
  const content = await getPublicWeddingExperience(slug)

  if (!content) {
    notFound()
  }

  return <WeddingExperience content={content} />
}
