import type { TableRepository } from "@/domains/guests/domain/ports/table.repository"

export async function deleteTableUseCase(input: {
  tableRepository: TableRepository
  weddingId: string
  tableId: string
}): Promise<boolean> {
  return input.tableRepository.delete(input.tableId, input.weddingId)
}
