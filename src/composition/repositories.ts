import "server-only"

import { cache } from "react"

import { getD1, getPrisma } from "@/core/db/prisma"
import { PrismaGuestRepository } from "@/domains/guests/adapters/prisma/prisma-guest.repository"
import { PrismaTableRepository } from "@/domains/guests/adapters/prisma/prisma-table.repository"
import { PrismaInvitationRepository } from "@/domains/invitations/adapters/prisma/prisma-invitation.repository"
import { PrismaMediaRepository } from "@/domains/media/adapters/prisma/prisma-media.repository"
import { PrismaTaskRepository } from "@/domains/tasks/adapters/prisma/prisma-task.repository"
import { PrismaWeddingSiteRepository } from "@/domains/wedding-sites/adapters/prisma/prisma-wedding-site.repository"
import { PrismaWeddingRepository } from "@/domains/weddings/adapters/prisma/prisma-wedding.repository"

export const getRepositories = cache(async () => {
  const [prisma, d1] = await Promise.all([getPrisma(), getD1()])

  return {
    wedding: new PrismaWeddingRepository(prisma),
    guest: new PrismaGuestRepository(prisma, d1),
    table: new PrismaTableRepository(prisma, d1),
    invitation: new PrismaInvitationRepository(prisma),
    media: new PrismaMediaRepository(prisma),
    weddingSite: new PrismaWeddingSiteRepository(prisma),
    task: new PrismaTaskRepository(prisma),
  }
})
