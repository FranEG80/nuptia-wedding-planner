import type { Wedding } from "@/domains/weddings/domain/wedding"
import type {
  WeddingSiteModule,
  WeddingTimelineItem,
} from "@/domains/wedding-sites/domain/wedding-site-module"

export interface PublicWeddingSite {
  slug: string
  wedding: Wedding
  modules: WeddingSiteModule[]
  timeline: WeddingTimelineItem[]
}

export interface UpdateWeddingSiteModuleInput {
  enabled?: boolean
  sortOrder?: number
}

export interface WeddingSiteRepository {
  listModulesByWeddingId(weddingId: string): Promise<WeddingSiteModule[]>
  findPublicBySlug(slug: string): Promise<PublicWeddingSite | null>
  updateModule(
    weddingId: string,
    type: WeddingSiteModule["type"],
    input: UpdateWeddingSiteModuleInput,
  ): Promise<WeddingSiteModule | null>
}
