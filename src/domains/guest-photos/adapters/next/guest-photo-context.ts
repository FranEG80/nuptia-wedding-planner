import "server-only"

import { mediaPublicUrl } from "@/composition/media-storage"
import { getRepositories } from "@/composition/repositories"
import { env } from "@/core/config/env"
import { parsePhoneList } from "@/domains/guests/domain/phone-key"
import {
  createWeddingExperienceFromPublicSite,
  photographerPhotoCredit,
} from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import { getPublicWeddingSiteUseCase } from "@/domains/wedding-sites/application/use-cases/get-public-wedding-site.use-case"

/**
 * Todo lo que la galería pública necesita de una boda a partir de su slug, o
 * null si la web no existe o no está publicada.
 */
export async function getGuestPhotoWeddingContext(slug: string) {
  const repositories = await getRepositories()
  const site = await getPublicWeddingSiteUseCase({
    weddingSiteRepository: repositories.weddingSite,
    slug,
  })

  if (!site) {
    return null
  }

  // Mismo orden de nombres que pinta la web (algunas bodas lo personalizan).
  const { partnerNames } = createWeddingExperienceFromPublicSite(site)

  return {
    repositories,
    weddingId: site.wedding.id,
    photographerCredit: photographerPhotoCredit(partnerNames),
    photographerPhoneKeys: parsePhoneList(env.WEDDING_PHOTOGRAPHER_PHONES),
    resolveUrl: mediaPublicUrl,
  }
}
