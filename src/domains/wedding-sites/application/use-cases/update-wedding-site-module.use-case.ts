import type { WeddingSiteRepository } from "@/domains/wedding-sites/domain/ports/wedding-site.repository"
import type { WeddingSiteModule } from "@/domains/wedding-sites/domain/wedding-site-module"
import {
  toWeddingSiteModuleDto,
  type UpdateWeddingSiteModuleDto,
  type WeddingSiteModuleDto,
} from "@/domains/wedding-sites/application/dtos/wedding-site-module.dto"

export async function updateWeddingSiteModuleUseCase(input: {
  weddingSiteRepository: WeddingSiteRepository
  weddingId: string
  type: WeddingSiteModule["type"]
  data: UpdateWeddingSiteModuleDto
}): Promise<WeddingSiteModuleDto | null> {
  const siteModule = await input.weddingSiteRepository.updateModule(
    input.weddingId,
    input.type,
    input.data,
  )

  return siteModule ? toWeddingSiteModuleDto(siteModule) : null
}
