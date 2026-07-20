import type { PrismaClient } from "@generated/prisma/client"

import type { WeddingTask } from "@/domains/tasks/domain/task"
import type {
  CreateTaskInput,
  TaskRepository,
  UpdateTaskInput,
} from "@/domains/tasks/domain/ports/task.repository"

type PrismaTaskRecord = {
  id: string
  weddingId: string
  title: string
  notes: string | null
  done: boolean
  createdById: string | null
  completedById: string | null
  completedAt: Date | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

function toTask(record: PrismaTaskRecord): WeddingTask {
  return {
    id: record.id,
    weddingId: record.weddingId,
    title: record.title,
    notes: record.notes,
    done: record.done,
    createdById: record.createdById,
    completedById: record.completedById,
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByWeddingId(weddingId: string): Promise<WeddingTask[]> {
    const tasks = await this.prisma.weddingTask.findMany({
      where: { weddingId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })

    return tasks.map(toTask)
  }

  async create(input: CreateTaskInput): Promise<WeddingTask> {
    const task = await this.prisma.weddingTask.create({
      data: {
        weddingId: input.weddingId,
        title: input.title,
        notes: input.notes ?? null,
        createdById: input.createdById ?? null,
      },
    })

    return toTask(task)
  }

  async update(
    id: string,
    weddingId: string,
    input: UpdateTaskInput,
  ): Promise<WeddingTask | null> {
    const current = await this.prisma.weddingTask.findFirst({
      where: { id, weddingId },
    })

    if (!current) {
      return null
    }

    const task = await this.prisma.weddingTask.update({
      where: { id },
      data: {
        title: input.title,
        notes: input.notes,
        done: input.done,
        completedById: input.completedById,
        completedAt:
          input.completedById === undefined
            ? undefined
            : input.completedById
              ? new Date()
              : null,
      },
    })

    return toTask(task)
  }

  async delete(id: string, weddingId: string): Promise<boolean> {
    const current = await this.prisma.weddingTask.findFirst({
      where: { id, weddingId },
    })

    if (!current) {
      return false
    }

    await this.prisma.weddingTask.delete({ where: { id } })
    return true
  }
}
