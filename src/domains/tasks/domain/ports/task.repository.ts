import type { WeddingTask } from "@/domains/tasks/domain/task"

export interface CreateTaskInput {
  weddingId: string
  title: string
  notes?: string | null
  createdById?: string | null
}

export interface UpdateTaskInput {
  title?: string
  notes?: string | null
  done?: boolean
  completedById?: string | null
}

export interface TaskRepository {
  listByWeddingId(weddingId: string): Promise<WeddingTask[]>
  create(input: CreateTaskInput): Promise<WeddingTask>
  update(
    id: string,
    weddingId: string,
    input: UpdateTaskInput,
  ): Promise<WeddingTask | null>
  delete(id: string, weddingId: string): Promise<boolean>
}
