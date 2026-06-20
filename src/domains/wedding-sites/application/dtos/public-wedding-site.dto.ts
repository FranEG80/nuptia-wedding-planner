import { toWeddingDto, type WeddingDto } from "@/domains/weddings/application/dtos/wedding.dto"
import type { PublicWeddingSite } from "@/domains/wedding-sites/domain/ports/wedding-site.repository"
import {
  toWeddingSiteModuleDto,
  toWeddingTimelineItemDto,
  type WeddingSiteModuleDto,
  type WeddingTimelineItemDto,
} from "@/domains/wedding-sites/application/dtos/wedding-site-module.dto"

export interface PublicWeddingSiteDto {
  slug: string
  wedding: WeddingDto
  modules: WeddingSiteModuleDto[]
  timeline: WeddingTimelineItemDto[]
}

export function toPublicWeddingSiteDto(
  site: PublicWeddingSite,
): PublicWeddingSiteDto {
  return {
    slug: site.slug,
    wedding: toWeddingDto(site.wedding),
    modules: site.modules.map(toWeddingSiteModuleDto),
    timeline: site.timeline.map(toWeddingTimelineItemDto),
  }
}
