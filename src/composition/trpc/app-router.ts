import { createTRPCRouter } from "@/core/trpc/init"
import { guestsRouter } from "@/domains/guests/adapters/trpc/guests.router"
import { invitationsRouter } from "@/domains/invitations/adapters/trpc/invitations.router"
import { mediaRouter } from "@/domains/media/adapters/trpc/media.router"
import { weddingSiteRouter } from "@/domains/wedding-sites/adapters/trpc/wedding-site.router"
import { weddingsRouter } from "@/domains/weddings/adapters/trpc/weddings.router"

export const appRouter = createTRPCRouter({
  guests: guestsRouter,
  invitations: invitationsRouter,
  media: mediaRouter,
  weddingSite: weddingSiteRouter,
  weddings: weddingsRouter,
})

export type AppRouter = typeof appRouter
