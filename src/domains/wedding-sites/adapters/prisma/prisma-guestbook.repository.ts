import type { PrismaClient } from "@generated/prisma/client"
import {
  isGuestbookSignatureStatus,
  type GuestbookModerationSignature,
  type GuestbookSignature,
  type GuestbookSignatureStatus,
} from "@/domains/wedding-sites/domain/guestbook"
import type {
  CreateGuestbookSignatureInput,
  GuestbookRepository,
} from "@/domains/wedding-sites/domain/ports/guestbook.repository"

const PUBLISHED: GuestbookSignatureStatus = "published"

type PrismaGuestbookSignatureRecord = {
  id: string
  authorName: string
  message: string
  createdAt: Date
}

const signatureSelect = {
  id: true,
  authorName: true,
  message: true,
  createdAt: true,
} as const

function toGuestbookSignature(record: PrismaGuestbookSignatureRecord): GuestbookSignature {
  return {
    id: record.id,
    authorName: record.authorName,
    message: record.message,
    createdAt: record.createdAt.toISOString(),
  }
}

export class PrismaGuestbookRepository implements GuestbookRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listPage(
    weddingId: string,
    range: { offset: number; limit: number },
  ): Promise<{ signatures: GuestbookSignature[]; total: number }> {
    const where = { weddingId, status: PUBLISHED }
    // D1 no admite transacciones interactivas: dos lecturas en paralelo bastan.
    const [records, total] = await Promise.all([
      this.prisma.guestbookSignature.findMany({
        where,
        select: signatureSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: range.offset,
        take: range.limit,
      }),
      this.prisma.guestbookSignature.count({ where }),
    ])

    return { signatures: records.map(toGuestbookSignature), total }
  }

  async create(input: CreateGuestbookSignatureInput): Promise<GuestbookSignature> {
    const record = await this.prisma.guestbookSignature.create({
      data: {
        weddingId: input.weddingId,
        guestId: input.guestId,
        authorName: input.authorName,
        message: input.message,
        status: PUBLISHED,
      },
      select: signatureSelect,
    })

    return toGuestbookSignature(record)
  }

  async listForModeration(weddingId: string): Promise<GuestbookModerationSignature[]> {
    const records = await this.prisma.guestbookSignature.findMany({
      where: { weddingId },
      select: {
        ...signatureSelect,
        status: true,
        guestId: true,
        guest: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    })

    return records.map((record) => ({
      ...toGuestbookSignature(record),
      // La web solo enseña "published": cualquier otro valor ya está oculto.
      status: isGuestbookSignatureStatus(record.status) ? record.status : "hidden",
      guestId: record.guestId,
      guestName: record.guest.name,
    }))
  }

  async setStatus(
    weddingId: string,
    signatureId: string,
    status: GuestbookSignatureStatus,
  ): Promise<boolean> {
    const { count } = await this.prisma.guestbookSignature.updateMany({
      where: { id: signatureId, weddingId },
      data: { status },
    })

    return count > 0
  }

  async delete(weddingId: string, signatureId: string): Promise<boolean> {
    const { count } = await this.prisma.guestbookSignature.deleteMany({
      where: { id: signatureId, weddingId },
    })

    return count > 0
  }
}
