import type { TaskRepository } from "@/domains/tasks/domain/ports/task.repository"

export async function deleteTaskUseCase(input: {
  taskRepository: TaskRepository
  weddingId: string
  taskId: string
}): Promise<boolean> {
  return input.taskRepository.delete(input.taskId, input.weddingId)
}
