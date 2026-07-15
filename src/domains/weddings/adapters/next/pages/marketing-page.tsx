import type { GuestDto } from "@/domains/guests/application/dtos/guest.dto"
import { getRepositories } from "@/composition/repositories"
import { listGuestsUseCase } from "@/domains/guests/application/use-cases/list-guests.use-case"
import { MarketingView } from "@/domains/weddings/adapters/next/components/marketing-view"

export async function MarketingPage() {
  let guests: GuestDto[] = []

  try {
    const repositories = await getRepositories()
    const wedding = await repositories.wedding.findBySlug("demo")

    if (wedding) {
      guests = await listGuestsUseCase({
        guestRepository: repositories.guest,
        weddingId: wedding.id,
      })
    }
  } catch {
    guests = []
  }

  return <MarketingView guests={guests} />
}
