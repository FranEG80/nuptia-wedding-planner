import type { WeddingSiteRepository } from "@/domains/wedding-sites/domain/ports/wedding-site.repository"
import {
  toWeddingSiteModuleDto,
  type WeddingSiteModuleDto,
} from "@/domains/wedding-sites/application/dtos/wedding-site-module.dto"

export async function listWeddingSiteModulesUseCase(input: {
  weddingSiteRepository: WeddingSiteRepository
  weddingId: string
}): Promise<WeddingSiteModuleDto[]> {
  const modules = await input.weddingSiteRepository.listModulesByWeddingId(
    input.weddingId,
  )

  return modules.map(toWeddingSiteModuleDto)
}
