"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import type {
  CreateInvitationPartyDto,
  UpdateInvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import { toInvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import { createInvitationPartyUseCase } from "@/domains/guests/application/use-cases/create-invitation-party.use-case"
import { updateInvitationPartyUseCase } from "@/domains/guests/application/use-cases/update-invitation-party.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

const markPartiesInvitedSchema = z.array(z.string().min(1)).min(1)

export async function createInvitationPartyAction(
  input: CreateInvitationPartyDto,
) {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const party = await createInvitationPartyUseCase({
    guestRepository: repositories.guest,
    weddingId: wedding.id,
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
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const party = await updateInvitationPartyUseCase({
    guestRepository: repositories.guest,
    weddingId: wedding.id,
    data: input,
  })

  revalidatePath("/app/invitados")

  return party
}

export async function markGuestPartiesInvitedAction(partyIds: string[]) {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const parsedPartyIds = markPartiesInvitedSchema.parse(partyIds)
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return []
  }

  await repositories.guest.markPartiesInvited(
    wedding.id,
    parsedPartyIds,
  )
  const parties = await repositories.guest.listPartiesByWeddingId(wedding.id)

  revalidatePath("/app/invitados")

  return parties.map(toInvitationPartyDto)
}
