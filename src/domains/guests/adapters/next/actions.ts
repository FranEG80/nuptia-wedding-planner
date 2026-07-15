"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { toGuestDto } from "@/domains/guests/application/dtos/guest.dto"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

const markPartiesInvitedSchema = z.array(z.string().min(1)).min(1)

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

  const guests = await repositories.guest.markPartiesInvited(
    wedding.id,
    parsedPartyIds,
  )

  revalidatePath("/app/invitados")

  return guests.map(toGuestDto)
}
