"use server"

import { revalidatePath } from "next/cache"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { isDemoSession } from "@/core/demo/is-demo-session"
import type { CreateTableDto, UpdateTableDto } from "@/domains/guests/application/dtos/table.dto"
import { assignGuestSeatUseCase } from "@/domains/guests/application/use-cases/assign-guest-seat.use-case"
import { createTableUseCase } from "@/domains/guests/application/use-cases/create-table.use-case"
import { deleteTableUseCase } from "@/domains/guests/application/use-cases/delete-table.use-case"
import { unassignGuestSeatUseCase } from "@/domains/guests/application/use-cases/unassign-guest-seat.use-case"
import { updateTableUseCase } from "@/domains/guests/application/use-cases/update-table.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

export async function createTableAction(input: CreateTableDto) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const table = await createTableUseCase({
    tableRepository: repositories.table,
    weddingId: wedding.id,
    data: input,
  })

  revalidatePath("/app/invitados")

  return table
}

export async function updateTableAction(input: UpdateTableDto) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const table = await updateTableUseCase({
    tableRepository: repositories.table,
    weddingId: wedding.id,
    data: input,
  })

  revalidatePath("/app/invitados")

  return table
}

export async function deleteTableAction(tableId: string) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return false
  }

  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return false
  }

  const deleted = await deleteTableUseCase({
    tableRepository: repositories.table,
    weddingId: wedding.id,
    tableId,
  })

  revalidatePath("/app/invitados")

  return deleted
}

export async function assignGuestSeatAction(guestId: string, tableId: string) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const guest = await assignGuestSeatUseCase({
    guestRepository: repositories.guest,
    tableRepository: repositories.table,
    weddingId: wedding.id,
    guestId,
    tableId,
  })

  revalidatePath("/app/invitados")

  return guest
}

export async function unassignGuestSeatAction(guestId: string) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const guest = await unassignGuestSeatUseCase({
    guestRepository: repositories.guest,
    weddingId: wedding.id,
    guestId,
  })

  revalidatePath("/app/invitados")

  return guest
}
