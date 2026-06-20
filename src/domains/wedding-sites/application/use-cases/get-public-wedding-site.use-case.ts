import type { WeddingSiteRepository } from "@/domains/wedding-sites/domain/ports/wedding-site.repository"
import {
  toPublicWeddingSiteDto,
  type PublicWeddingSiteDto,
} from "@/domains/wedding-sites/application/dtos/public-wedding-site.dto"

export async function getPublicWeddingSiteUseCase(input: {
  weddingSiteRepository: WeddingSiteRepository
  slug: string
}): Promise<PublicWeddingSiteDto | null> {
  const site = await input.weddingSiteRepository.findPublicBySlug(input.slug)

  return site ? toPublicWeddingSiteDto(site) : null
}
