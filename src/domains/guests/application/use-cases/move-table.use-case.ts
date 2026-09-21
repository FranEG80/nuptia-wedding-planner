import {
  moveTableSchema,
  toTableDto,
  type MoveTableDto,
  type TableDto,
} from "@/domains/guests/application/dtos/table.dto"
import type { TableRepository } from "@/domains/guests/domain/ports/table.repository"

export async function moveTableUseCase(input: {
  tableRepository: TableRepository
  weddingId: string
  data: MoveTableDto
}): Promise<TableDto[]> {
  const data = moveTableSchema.parse(input.data)
  const tables = await input.tableRepository.move(
    data.tableId,
    input.weddingId,
    data.direction,
  )

  return tables.map(toTableDto)
}
