export interface WeddingTask {
  id: string
  weddingId: string
  title: string
  notes: string | null
  done: boolean
  createdById: string | null
  completedById: string | null
  completedAt: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}
