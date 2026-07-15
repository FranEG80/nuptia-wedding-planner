import { requireAppSession } from "@/core/auth"
import { getRepositories } from "@/composition/repositories"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"
import { getDashboardSummaryUseCase } from "@/domains/weddings/application/use-cases/get-dashboard-summary.use-case"
import { DashboardView } from "@/domains/weddings/adapters/next/components/dashboard-view"

export async function DashboardPage() {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const summary = await getDashboardSummaryUseCase({
    guestRepository: repositories.guest,
    weddingId: wedding.id,
  })

  return (
    <DashboardView
      summary={summary}
      wedding={wedding}
      userName={session.appUser.name}
    />
  )
}
