import { toTaskDto, type WeddingTaskDto } from "@/domains/tasks/application/dtos/task.dto"
import type { TaskRepository } from "@/domains/tasks/domain/ports/task.repository"

export async function listTasksUseCase(input: {
  taskRepository: TaskRepository
  weddingId: string
  memberNameById: Record<string, string>
}): Promise<WeddingTaskDto[]> {
  const tasks = await input.taskRepository.listByWeddingId(input.weddingId)

  return tasks
    .slice()
    .sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1
      }
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder
      }
      return a.createdAt.localeCompare(b.createdAt)
    })
    .map((task) => toTaskDto(task, input.memberNameById))
}
