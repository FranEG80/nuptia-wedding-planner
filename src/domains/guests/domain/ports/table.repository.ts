import type { WeddingTable } from "@/domains/guests/domain/table"

export interface CreateTableInput {
  weddingId: string
  name?: string
  capacity?: number | null
}

export interface UpdateTableInput {
  name?: string
  capacity?: number | null
}

export interface TableRepository {
  listByWeddingId(weddingId: string): Promise<WeddingTable[]>
  create(input: CreateTableInput): Promise<WeddingTable>
  update(
    id: string,
    weddingId: string,
    input: UpdateTableInput,
  ): Promise<WeddingTable | null>
  delete(id: string, weddingId: string): Promise<boolean>
}
