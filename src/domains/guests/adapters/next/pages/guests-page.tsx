import { requireAppSession } from "@/core/auth"
import { env } from "@/core/config/env"
import { getRepositories } from "@/composition/repositories"
import { getCurrentWeddingId } from "@/composition/current-wedding"
import { DEFAULT_INVITATION_CONTENT } from "@/domains/invitations/domain/invitation-design"
import { MARIA_DANIELA_CUSTOM_DOMAIN } from "@/domains/invitations/domain/invitation-template-options"
import { getCurrentInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/get-current-invitation-design.use-case"
import { searchInvitationPartiesUseCase } from "@/domains/guests/application/use-cases/search-invitation-parties.use-case"
import { listTablesUseCase } from "@/domains/guests/application/use-cases/list-tables.use-case"
import { GuestsView } from "@/domains/guests/adapters/next/components/guests-view"
import type { InvitationPartyStatusFilter } from "@/domains/guests/domain/ports/guest.repository"

export const GUEST_PARTIES_PAGE_SIZE = 20

function parseStatus(value: string | undefined): InvitationPartyStatusFilter {
  return value === "confirmados" || value === "pendientes" || value === "declinados"
    ? value
    : "todos"
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export async function GuestsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; estado?: string }
}) {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const weddingId = await getCurrentWeddingId(session.appUser.id)

  const page = parsePage(searchParams.page)
  const search = searchParams.q?.trim() ?? ""
  const status = parseStatus(searchParams.estado)

  if (!weddingId) {
    return (
      <GuestsView
        initialParties={[]}
        total={0}
        page={1}
        pageSize={GUEST_PARTIES_PAGE_SIZE}
        search={search}
        status={status}
        initialTables={[]}
        initialWhatsappMessage={DEFAULT_INVITATION_CONTENT.whatsappMessage}
        publicInviteBaseUrl={env.APP_URL}
      />
    )
  }

  const [{ parties, total }, tables, design] = await Promise.all([
    searchInvitationPartiesUseCase({
      guestRepository: repositories.guest,
      weddingId,
      page,
      pageSize: GUEST_PARTIES_PAGE_SIZE,
      search,
      status,
    }),
    listTablesUseCase({
      tableRepository: repositories.table,
      weddingId,
    }),
    getCurrentInvitationDesignUseCase({
      invitationRepository: repositories.invitation,
      weddingId,
    }),
  ])

  // El dominio propio de esta boda ya sirve /i/[token] vía el rewrite de
  // middleware.ts; los enlaces que compartimos deben apuntar ahí en vez de
  // al dominio del panel (localhost, *.fenrig.dev, etc.).
  const publicInviteBaseUrl =
    design?.templateId === "maria-daniela"
      ? `https://${MARIA_DANIELA_CUSTOM_DOMAIN}`
      : env.APP_URL

  return (
    <GuestsView
      key={`${page}-${search}-${status}`}
      initialParties={parties}
      total={total}
      page={page}
      pageSize={GUEST_PARTIES_PAGE_SIZE}
      search={search}
      status={status}
      initialTables={tables}
      initialWhatsappMessage={
        design?.content.whatsappMessage ?? DEFAULT_INVITATION_CONTENT.whatsappMessage
      }
      publicInviteBaseUrl={publicInviteBaseUrl}
    />
  )
}
