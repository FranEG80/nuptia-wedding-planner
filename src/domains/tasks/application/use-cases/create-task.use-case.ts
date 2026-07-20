import {
  createTaskSchema,
  toTaskDto,
  type CreateTaskDto,
  type WeddingTaskDto,
} from "@/domains/tasks/application/dtos/task.dto"
import type { TaskRepository } from "@/domains/tasks/domain/ports/task.repository"

export async function createTaskUseCase(input: {
  taskRepository: TaskRepository
  weddingId: string
  createdById: string | null
  data: CreateTaskDto
  memberNameById: Record<string, string>
}): Promise<WeddingTaskDto> {
  const data = createTaskSchema.parse(input.data)
  const task = await input.taskRepository.create({
    weddingId: input.weddingId,
    title: data.title,
    notes: data.notes,
    createdById: input.createdById,
  })

  return toTaskDto(task, input.memberNameById)
}
