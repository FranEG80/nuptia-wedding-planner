import {
  toInvitationPartyDto,
  type InvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type {
  GuestRepository,
  InvitationPartyStatusFilter,
} from "@/domains/guests/domain/ports/guest.repository"

export interface SearchInvitationPartiesResult {
  parties: InvitationPartyDto[]
  total: number
}

export async function searchInvitationPartiesUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  page: number
  pageSize: number
  search?: string
  status?: InvitationPartyStatusFilter
}): Promise<SearchInvitationPartiesResult> {
  const { parties, total } = await input.guestRepository.searchInvitationParties(
    input.weddingId,
    {
      page: input.page,
      pageSize: input.pageSize,
      search: input.search,
      status: input.status,
    },
  )

  return { parties: parties.map(toInvitationPartyDto), total }
}
