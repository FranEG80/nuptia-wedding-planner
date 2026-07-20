"use server"

import { revalidatePath } from "next/cache"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import {
  buildMemberNameMap,
  type CreateTaskDto,
  type UpdateTaskDto,
} from "@/domains/tasks/application/dtos/task.dto"
import { createTaskUseCase } from "@/domains/tasks/application/use-cases/create-task.use-case"
import { deleteTaskUseCase } from "@/domains/tasks/application/use-cases/delete-task.use-case"
import { updateTaskUseCase } from "@/domains/tasks/application/use-cases/update-task.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

async function loadWeddingContext() {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const actingMemberId =
    wedding.members.find((member) => member.appUserId === session.appUser.id)
      ?.id ?? null
  const memberNameById = buildMemberNameMap(wedding.members, session.appUser)

  return { repositories, wedding, actingMemberId, memberNameById }
}

function revalidateTasks() {
  revalidatePath("/app/tareas")
  revalidatePath("/app/dashboard")
}

export async function createTaskAction(input: CreateTaskDto) {
  const context = await loadWeddingContext()

  if (!context) {
    return null
  }

  const task = await createTaskUseCase({
    taskRepository: context.repositories.task,
    weddingId: context.wedding.id,
    createdById: context.actingMemberId,
    data: input,
    memberNameById: context.memberNameById,
  })

  revalidateTasks()

  return task
}

export async function updateTaskAction(taskId: string, input: UpdateTaskDto) {
  const context = await loadWeddingContext()

  if (!context) {
    return null
  }

  const task = await updateTaskUseCase({
    taskRepository: context.repositories.task,
    weddingId: context.wedding.id,
    taskId,
    actingMemberId: context.actingMemberId,
    data: input,
    memberNameById: context.memberNameById,
  })

  revalidateTasks()

  return task
}

export async function toggleTaskAction(taskId: string, done: boolean) {
  return updateTaskAction(taskId, { done })
}

export async function deleteTaskAction(taskId: string) {
  const context = await loadWeddingContext()

  if (!context) {
    return false
  }

  const deleted = await deleteTaskUseCase({
    taskRepository: context.repositories.task,
    weddingId: context.wedding.id,
    taskId,
  })

  revalidateTasks()

  return deleted
}
