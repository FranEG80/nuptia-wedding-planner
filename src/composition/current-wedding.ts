import "server-only"

import { cache } from "react"

import { getRepositories } from "@/composition/repositories"
import { memoize } from "@/core/cache/memory-cache"
import { getCurrentWeddingIdUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding-id.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

const WEDDING_LOOKUP_TTL_MS = 60_000

const findCurrentWeddingId = memoize(
  async (appUserId: string) => {
    const repositories = await getRepositories()

    return getCurrentWeddingIdUseCase({
      weddingRepository: repositories.wedding,
      appUserId,
    })
  },
  {
    ttlMs: WEDDING_LOOKUP_TTL_MS,
    keyFn: (appUserId) => appUserId,
    // Never cache a miss — otherwise a user who just created their first
    // wedding would keep seeing "no wedding" until the TTL expires.
    shouldCache: (weddingId) => weddingId !== null,
  },
)

const findCurrentWedding = memoize(
  async (appUserId: string) => {
    const repositories = await getRepositories()

    return getCurrentWeddingUseCase({
      weddingRepository: repositories.wedding,
      appUserId,
    })
  },
  {
    ttlMs: WEDDING_LOOKUP_TTL_MS,
    keyFn: (appUserId) => appUserId,
    shouldCache: (wedding) => wedding !== null,
  },
)

// Prefer this over calling getCurrentWeddingUseCase directly: it dedupes
// repeat lookups within one request (React.cache keys on the plain
// appUserId string, unlike the use-case's object argument), stays cached
// for WEDDING_LOOKUP_TTL_MS across requests on the same warm serverless
// instance, and only pulls the wedding id, skipping the
// members/ceremonyLocation/restaurant/menu joins callers that just need to
// scope a query don't use.
export const getCurrentWeddingId = cache(findCurrentWeddingId)

// Full wedding aggregate (members, venue, restaurant, menu). Use only when
// the caller actually needs those fields (dashboard, invitation design,
// wedding site) — reach for getCurrentWeddingId otherwise. Same cross-request
// caching as getCurrentWeddingId.
export const getCurrentWedding = cache(findCurrentWedding)
