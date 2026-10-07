import { z } from "zod"

import type { WeddingTable } from "@/domains/guests/domain/table"

export interface TableDto {
  id: string
  weddingId: string
  name: string
  sortOrder: number
  capacity: number | null
  phrase: string | null
}

export function toTableDto(table: WeddingTable): TableDto {
  return {
    id: table.id,
    weddingId: table.weddingId,
    name: table.name,
    sortOrder: table.sortOrder,
    capacity: table.capacity,
    phrase: table.phrase,
  }
}

export const TABLE_PHRASE_MAX_LENGTH = 160

// Frase libre que se imprime en el mesario; vacía equivale a no tener frase.
const tablePhraseSchema = z
  .string()
  .trim()
  .max(TABLE_PHRASE_MAX_LENGTH)
  .transform((value) => value || null)
  .nullable()
  .optional()

export const createTableSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  capacity: z.number().int().positive().max(200).nullable().optional(),
  phrase: tablePhraseSchema,
})

export const updateTableSchema = z.object({
  tableId: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  capacity: z.number().int().positive().max(200).nullable().optional(),
  phrase: tablePhraseSchema,
})

export const moveTableSchema = z.object({
  tableId: z.string().min(1),
  direction: z.enum(["up", "down"]),
})

export type CreateTableDto = z.input<typeof createTableSchema>
export type UpdateTableDto = z.input<typeof updateTableSchema>
export type MoveTableDto = z.input<typeof moveTableSchema>
