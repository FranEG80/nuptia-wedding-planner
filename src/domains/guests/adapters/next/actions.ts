"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { getCurrentWeddingId } from "@/composition/current-wedding"
import { requireAppSession } from "@/core/auth"
import { isDemoSession } from "@/core/demo/is-demo-session"
import type {
  CreateInvitationPartyDto,
  UpdateInvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import { toInvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import {
  respondInvitationPartySchema,
  type RespondInvitationPartyDto,
} from "@/domains/guests/application/dtos/respond-invitation-party.dto"
import { createInvitationPartyUseCase } from "@/domains/guests/application/use-cases/create-invitation-party.use-case"
import { deleteInvitationPartyUseCase } from "@/domains/guests/application/use-cases/delete-invitation-party.use-case"
import {
  importInvitationPartiesUseCase,
  type ImportInvitationPartiesResult,
} from "@/domains/guests/application/use-cases/import-invitation-parties.use-case"
import { linkInvitationPartyUseCase } from "@/domains/guests/application/use-cases/link-invitation-party.use-case"
import { listInvitationPartiesUseCase } from "@/domains/guests/application/use-cases/list-invitation-parties.use-case"
import { updateInvitationPartyUseCase } from "@/domains/guests/application/use-cases/update-invitation-party.use-case"
import { respondToPublicInvitationUseCase } from "@/domains/invitations/application/use-cases/respond-to-public-invitation.use-case"

const markPartiesInvitedSchema = z.array(z.string().min(1)).min(1)

export async function createInvitationPartyAction(
  input: CreateInvitationPartyDto,
) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return null
  }

  const party = await createInvitationPartyUseCase({
    guestRepository: repositories.guest,
    weddingId,
    data: input,
  })

  revalidatePath("/app/invitados")

  return party
}

export async function updateInvitationPartyAction(
  input: UpdateInvitationPartyDto,
) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return null
  }

  const party = await updateInvitationPartyUseCase({
    guestRepository: repositories.guest,
    weddingId,
    data: input,
  })

  revalidatePath("/app/invitados")

  return party
}

export async function linkInvitationPartyAction(input: {
  targetPartyId: string
  sourcePartyId: string
}) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return null
  }

  const party = await linkInvitationPartyUseCase({
    guestRepository: repositories.guest,
    weddingId,
    targetPartyId: input.targetPartyId,
    sourcePartyId: input.sourcePartyId,
  })

  revalidatePath("/app/invitados")

  return party
}

export async function importInvitationPartiesAction(
  input: CreateInvitationPartyDto[],
): Promise<ImportInvitationPartiesResult | null> {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return null
  }

  const result = await importInvitationPartiesUseCase({
    guestRepository: repositories.guest,
    weddingId,
    parties: input,
  })

  revalidatePath("/app/invitados")

  return result
}

export async function deleteInvitationPartyAction(partyId: string) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return false
  }

  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return false
  }

  const deleted = await deleteInvitationPartyUseCase({
    guestRepository: repositories.guest,
    weddingId,
    partyId,
  })

  revalidatePath("/app/invitados")

  return deleted
}

export async function markGuestPartiesInvitedAction(partyIds: string[]) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return false
  }

  const parsedPartyIds = markPartiesInvitedSchema.parse(partyIds)
  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return false
  }

  await repositories.guest.markPartiesInvited(weddingId, parsedPartyIds)

  revalidatePath("/app/invitados")

  return true
}

export async function getInvitationPartyDetailAction(inviteToken: string) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return null
  }

  const party = await repositories.guest.findPartyByInviteToken(inviteToken)

  if (!party || party.weddingId !== weddingId) {
    return null
  }

  return toInvitationPartyDto(party)
}

export async function listAllInvitationPartiesAction() {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return []
  }

  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return []
  }

  return listInvitationPartiesUseCase({
    guestRepository: repositories.guest,
    weddingId,
  })
}

export async function respondToInvitationPartyAction(
  input: RespondInvitationPartyDto,
) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const weddingId = await getCurrentWeddingId(session.appUser.id)

  if (!weddingId) {
    return null
  }

  const parsed = respondInvitationPartySchema.parse(input)
  const party = await repositories.guest.findPartyByInviteToken(parsed.token)

  if (!party || party.weddingId !== weddingId) {
    return null
  }

  const guestsById = new Map(party.guests.map((guest) => [guest.id, guest]))
  const guestsInput = parsed.guests.map((response) => {
    const guest = guestsById.get(response.guestId)

    return {
      guestId: response.guestId,
      attending: response.attending,
      firstName: guest?.firstName,
      lastName: guest?.lastName,
      email: guest?.email,
      phone: guest?.phone,
      notes: response.notes,
      menuSelections: guest?.menuSelections ?? [],
    }
  })

  const updated = await respondToPublicInvitationUseCase({
    guestRepository: repositories.guest,
    token: parsed.token,
    guests: guestsInput,
    message: parsed.message,
  })

  revalidatePath("/app/invitados")

  return updated ? toInvitationPartyDto(updated) : null
}
