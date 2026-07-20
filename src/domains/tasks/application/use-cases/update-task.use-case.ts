import {
  toTaskDto,
  updateTaskSchema,
  type UpdateTaskDto,
  type WeddingTaskDto,
} from "@/domains/tasks/application/dtos/task.dto"
import type { TaskRepository } from "@/domains/tasks/domain/ports/task.repository"

export async function updateTaskUseCase(input: {
  taskRepository: TaskRepository
  weddingId: string
  taskId: string
  actingMemberId: string | null
  data: UpdateTaskDto
  memberNameById: Record<string, string>
}): Promise<WeddingTaskDto | null> {
  const data = updateTaskSchema.parse(input.data)

  const task = await input.taskRepository.update(input.taskId, input.weddingId, {
    title: data.title,
    notes: data.notes,
    done: data.done,
    completedById:
      data.done === undefined
        ? undefined
        : data.done
          ? input.actingMemberId
          : null,
  })

  return task ? toTaskDto(task, input.memberNameById) : null
}
