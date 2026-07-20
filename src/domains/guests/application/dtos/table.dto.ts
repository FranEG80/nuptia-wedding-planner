import { z } from "zod"

import type { WeddingTable } from "@/domains/guests/domain/table"

export interface TableDto {
  id: string
  weddingId: string
  name: string
  sortOrder: number
  capacity: number | null
}

export function toTableDto(table: WeddingTable): TableDto {
  return {
    id: table.id,
    weddingId: table.weddingId,
    name: table.name,
    sortOrder: table.sortOrder,
    capacity: table.capacity,
  }
}

export const createTableSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  capacity: z.number().int().positive().max(200).nullable().optional(),
})

export const updateTableSchema = z.object({
  tableId: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  capacity: z.number().int().positive().max(200).nullable().optional(),
})

export type CreateTableDto = z.input<typeof createTableSchema>
export type UpdateTableDto = z.input<typeof updateTableSchema>
