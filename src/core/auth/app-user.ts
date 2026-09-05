import "server-only"

import { getPrisma } from "@/core/db/prisma"
import type { AppUser, AuthSession } from "@/core/auth/types"
import { memoize } from "@/core/cache/memory-cache"

type AppUserRecord = {
  id: string
  email: string
  name: string
  lastName: string | null
  phone: string | null
  imageUrl: string | null
}

function normalizedEmail(session: AuthSession) {
  return (
    session.user.email ||
    `${session.provider}-${session.user.id}@users.nuptia.local`
  ).toLowerCase()
}

function toAppUser(record: AppUserRecord): AppUser {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    lastName: record.lastName,
    phone: record.phone,
    imageUrl: record.imageUrl,
  }
}

async function resolveAppUserForAuthSessionUncached(
  session: AuthSession,
): Promise<AppUser> {
  const prisma = await getPrisma()
  const provider = session.provider
  const providerUserId = session.user.id
  const email = normalizedEmail(session)

  const identity = await prisma.authIdentity.findUnique({
    where: {
      provider_providerUserId: {
        provider,
        providerUserId,
      },
    },
    include: {
      appUser: true,
    },
  })

  if (identity) {
    const current = identity.appUser
    const nextImageUrl = session.user.imageUrl ?? null
    const needsSync =
      current.email !== email ||
      current.name !== session.user.name ||
      current.imageUrl !== nextImageUrl

    const appUser = needsSync
      ? await prisma.appUser.update({
          where: { id: identity.appUserId },
          data: {
            email,
            name: session.user.name,
            imageUrl: nextImageUrl,
          },
        })
      : current

    return toAppUser(appUser)
  }

  const appUser = await prisma.appUser.upsert({
    where: { email },
    update: {
      name: session.user.name,
      imageUrl: session.user.imageUrl ?? null,
    },
    create: {
      email,
      name: session.user.name,
      imageUrl: session.user.imageUrl ?? null,
    },
  })

  await prisma.authIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider,
        providerUserId,
      },
    },
    update: {
      appUserId: appUser.id,
      email,
    },
    create: {
      appUserId: appUser.id,
      provider,
      providerUserId,
      email,
    },
  })

  return toAppUser(appUser)
}

// The session lookup itself (getBetterAuthSession/getSupabaseSession) is
// always checked fresh — this only caches the "which AppUser does this
// already-valid identity map to" step, so it can't extend a revoked
// session's lifetime.
export const resolveAppUserForAuthSession = memoize(
  resolveAppUserForAuthSessionUncached,
  {
    ttlMs: 60_000,
    keyFn: (session) => `${session.provider}:${session.user.id}`,
  },
)
