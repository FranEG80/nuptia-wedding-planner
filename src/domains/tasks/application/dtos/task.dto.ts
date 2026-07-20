import { z } from "zod"

import type { WeddingTask } from "@/domains/tasks/domain/task"
import type { WeddingMember } from "@/domains/weddings/domain/wedding"

export const createTaskSchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  done: z.boolean().optional(),
})

export type CreateTaskDto = z.infer<typeof createTaskSchema>
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>

export interface WeddingTaskDto {
  id: string
  weddingId: string
  title: string
  notes: string | null
  done: boolean
  createdByName: string | null
  completedByName: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export function buildMemberNameMap(
  members: WeddingMember[],
  currentAppUser: { id: string; name: string },
): Record<string, string> {
  return Object.fromEntries(
    members.map((member) => [
      member.id,
      member.displayName ??
        (member.appUserId === currentAppUser.id
          ? currentAppUser.name
          : "Pareja"),
    ]),
  )
}

export function toTaskDto(
  task: WeddingTask,
  memberNameById: Record<string, string>,
): WeddingTaskDto {
  return {
    id: task.id,
    weddingId: task.weddingId,
    title: task.title,
    notes: task.notes,
    done: task.done,
    createdByName: task.createdById
      ? (memberNameById[task.createdById] ?? null)
      : null,
    completedByName: task.completedById
      ? (memberNameById[task.completedById] ?? null)
      : null,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}
