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
  const currentTable = (await input.tableRepository.listByWeddingId(input.weddingId)).find(
    (table) => table.id === data.tableId,
  )

  if (data.capacity != null && currentTable?.capacity !== data.capacity) {
    const occupiedCount = await input.tableRepository.countOccupiedSeats(
      data.tableId,
      input.weddingId,
    )

    if (occupiedCount > data.capacity) {
      throw new Error(
        `La mesa tiene ${occupiedCount} comensales y no puede tener una capacidad inferior.`,
      )
    }
  }

  const table = await input.tableRepository.update(data.tableId, input.weddingId, {
    name: data.name,
    capacity: data.capacity,
    phrase: data.phrase,
  })

  return table ? toTableDto(table) : null
}
