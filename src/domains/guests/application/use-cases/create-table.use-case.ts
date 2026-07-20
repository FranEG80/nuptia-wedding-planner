import {
  createTableSchema,
  toTableDto,
  type CreateTableDto,
  type TableDto,
} from "@/domains/guests/application/dtos/table.dto"
import type { TableRepository } from "@/domains/guests/domain/ports/table.repository"

export async function createTableUseCase(input: {
  tableRepository: TableRepository
  weddingId: string
  data: CreateTableDto
}): Promise<TableDto> {
  const data = createTableSchema.parse(input.data)
  const table = await input.tableRepository.create({
    weddingId: input.weddingId,
    name: data.name,
    capacity: data.capacity,
  })

  return toTableDto(table)
}
