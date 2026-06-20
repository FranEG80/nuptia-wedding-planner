import "server-only"

import { prisma } from "@/core/db/prisma"
import { PrismaGuestRepository } from "@/domains/guests/adapters/prisma/prisma-guest.repository"
import { PrismaInvitationRepository } from "@/domains/invitations/adapters/prisma/prisma-invitation.repository"
import { PrismaMediaRepository } from "@/domains/media/adapters/prisma/prisma-media.repository"
import { PrismaWeddingSiteRepository } from "@/domains/wedding-sites/adapters/prisma/prisma-wedding-site.repository"
import { PrismaWeddingRepository } from "@/domains/weddings/adapters/prisma/prisma-wedding.repository"

export const repositories = {
  wedding: new PrismaWeddingRepository(prisma),
  guest: new PrismaGuestRepository(prisma),
  invitation: new PrismaInvitationRepository(prisma),
  media: new PrismaMediaRepository(prisma),
  weddingSite: new PrismaWeddingSiteRepository(prisma),
}
