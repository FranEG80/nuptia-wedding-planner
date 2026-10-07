"use server"

import { getRepositories } from "@/composition/repositories"
import { getCurrentWeddingId } from "@/composition/current-wedding"
import { requireAppSession } from "@/core/auth"
import type { InvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import { listInvitationPartiesUseCase } from "@/domains/guests/application/use-cases/list-invitation-parties.use-case"
import { listTablesUseCase } from "@/domains/guests/application/use-cases/list-tables.use-case"

// Lo que necesitan los PDF de cartelería: la lista completa de invitados (no
// una página) y las mesas. Se pide al generar cada PDF, no al abrir la
// pantalla. Es solo lectura, así que la demo también lo usa.
export async function loadSignageDataAction(): Promise<{
  parties: InvitationPartyDto[]
  tables: TableDto[]
}> {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return { parties: [], tables: [] }
  }

  const [parties, tables] = await Promise.all([
    listInvitationPartiesUseCase({
      guestRepository: repositories.guest,
      weddingId,
    }),
    listTablesUseCase({
      tableRepository: repositories.table,
      weddingId,
    }),
  ])

  return { parties, tables }
}
