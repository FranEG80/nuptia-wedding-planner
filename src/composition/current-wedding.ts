import "server-only"

import { cache } from "react"

import { getRepositories } from "@/composition/repositories"
import { getCurrentWeddingIdUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding-id.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

// Prefer this over calling getCurrentWeddingUseCase directly: it dedupes
// repeat lookups within one request (React.cache keys on the plain
// appUserId string, unlike the use-case's object argument) and only pulls
// the wedding id, skipping the members/ceremonyLocation/restaurant/menu
// joins callers that just need to scope a query don't use.
export const getCurrentWeddingId = cache(async (appUserId: string) => {
  const repositories = await getRepositories()

  return getCurrentWeddingIdUseCase({
    weddingRepository: repositories.wedding,
    appUserId,
  })
})

// Full wedding aggregate (members, venue, restaurant, menu). Use only when
// the caller actually needs those fields (dashboard, invitation design,
// wedding site) — reach for getCurrentWeddingId otherwise.
export const getCurrentWedding = cache(async (appUserId: string) => {
  const repositories = await getRepositories()

  return getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId,
  })
})
