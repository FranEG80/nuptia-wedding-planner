import { toTableDto, type TableDto } from "@/domains/guests/application/dtos/table.dto"
import type { TableRepository } from "@/domains/guests/domain/ports/table.repository"

export async function listTablesUseCase(input: {
  tableRepository: TableRepository
  weddingId: string
}): Promise<TableDto[]> {
  const tables = await input.tableRepository.listByWeddingId(input.weddingId)

  return tables.map(toTableDto)
}
