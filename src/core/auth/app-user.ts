import "server-only"

import { getPrisma } from "@/core/db/prisma"
import type { AppUser, AuthSession } from "@/core/auth/types"

type AppUserRecord = {
  id: string
  email: string
  name: string
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
    imageUrl: record.imageUrl,
  }
}

export async function resolveAppUserForAuthSession(
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
    const appUser = await prisma.appUser.update({
      where: { id: identity.appUserId },
      data: {
        email,
        name: session.user.name,
        imageUrl: session.user.imageUrl ?? null,
      },
    })

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
