import {
  toTableDto,
  updateTableSchema,
  type TableDto,
  type UpdateTableDto,
} from "@/domains/guests/application/dtos/table.dto"
import type { TableRepository } from "@/domains/guests/domain/ports/table.repository"

export async function updateTableUseCase(input: {
  tableRepository: TableRepository
  weddingId: string
  data: UpdateTableDto
}): Promise<TableDto | null> {
  const data = updateTableSchema.parse(input.data)
  const table = await input.tableRepository.update(data.tableId, input.weddingId, {
    name: data.name,
    capacity: data.capacity,
  })

  return table ? toTableDto(table) : null
}
