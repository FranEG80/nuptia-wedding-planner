import type { PrismaClient } from "@generated/prisma/client"
import type { D1BatchDatabase } from "@/core/db/d1-batch"
import type { WeddingTable } from "@/domains/guests/domain/table"
import type {
  CreateTableInput,
  TableRepository,
  UpdateTableInput,
} from "@/domains/guests/domain/ports/table.repository"

function toTable(record: {
  id: string
  weddingId: string
  name: string
  sortOrder: number
  capacity: number | null
}): WeddingTable {
  return {
    id: record.id,
    weddingId: record.weddingId,
    name: record.name,
    sortOrder: record.sortOrder,
    capacity: record.capacity,
  }
}

export class PrismaTableRepository implements TableRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly d1: D1BatchDatabase,
  ) {}

  async listByWeddingId(weddingId: string): Promise<WeddingTable[]> {
    const tables = await this.prisma.weddingTable.findMany({
      where: { weddingId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })

    return tables.map(toTable)
  }

  async create(input: CreateTableInput): Promise<WeddingTable> {
    const last = await this.prisma.weddingTable.findFirst({
      where: { weddingId: input.weddingId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    })
    const sortOrder = (last?.sortOrder ?? 0) + 1

    const table = await this.prisma.weddingTable.create({
      data: {
        weddingId: input.weddingId,
        name: input.name?.trim() || `Mesa ${sortOrder}`,
        sortOrder,
        capacity: input.capacity ?? null,
      },
    })

    return toTable(table)
  }

  async update(
    id: string,
    weddingId: string,
    input: UpdateTableInput,
  ): Promise<WeddingTable | null> {
    const current = await this.prisma.weddingTable.findFirst({
      where: { id, weddingId },
    })

    if (!current) {
      return null
    }

    const table = await this.prisma.weddingTable.update({
      where: { id },
      data: {
        name: input.name?.trim() || undefined,
        capacity: input.capacity === undefined ? undefined : input.capacity,
      },
    })

    return toTable(table)
  }

  async delete(id: string, weddingId: string): Promise<boolean> {
    const current = await this.prisma.weddingTable.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })

    if (!current) {
      return false
    }

    await this.d1.batch([
      this.d1.prepare("DELETE FROM wedding_seats WHERE tableId = ?").bind(id),
      this.d1
        .prepare("DELETE FROM wedding_tables WHERE id = ? AND weddingId = ?")
        .bind(id, weddingId),
    ])

    return true
  }
}
