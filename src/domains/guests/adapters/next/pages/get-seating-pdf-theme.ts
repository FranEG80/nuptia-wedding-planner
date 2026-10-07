import type { MariaDanielaSeatingPdfTheme } from "@/domains/guests/adapters/next/components/export-maria-daniela-seating-pdf"
import { createWeddingExperienceFromWedding } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import type { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

// Los carteles de mesa con acuarelas solo existen para la plantilla
// María Daniela; el resto de bodas sigue con el PDF tabular.
export async function getSeatingPdfTheme(
  templateId: string | undefined,
  loadWedding: () => ReturnType<typeof getCurrentWeddingUseCase>,
): Promise<MariaDanielaSeatingPdfTheme | null> {
  if (templateId !== "maria-daniela") {
    return null
  }

  const wedding = await loadWedding()

  if (!wedding) {
    return null
  }

  const experience = createWeddingExperienceFromWedding(wedding, [])

  return {
    partnerNames: experience.partnerNames,
    dateLabel: experience.dateLabel,
  }
}
