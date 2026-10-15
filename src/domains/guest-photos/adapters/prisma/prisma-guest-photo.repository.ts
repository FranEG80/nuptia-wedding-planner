import type { PrismaClient } from "@generated/prisma/client"

import type {
  GuestPhoto,
  GuestPhotoStatus,
} from "@/domains/guest-photos/domain/guest-photo"
import type {
  CreateGuestPhotoInput,
  GuestPhotoPage,
  GuestPhotoRepository,
} from "@/domains/guest-photos/domain/ports/guest-photo.repository"

type PrismaGuestPhotoRecord = {
  id: string
  weddingId: string
  guestId: string | null
  uploaderRole: string
  uploaderPhone: string | null
  credit: string | null
  originalKey: string
  optimizedKey: string
  thumbnailKey: string
  contentType: string
  originalBytes: number
  width: number
  height: number
  status: string
  createdAt: Date
}

function toGuestPhoto(record: PrismaGuestPhotoRecord): GuestPhoto {
  return {
    id: record.id,
    weddingId: record.weddingId,
    guestId: record.guestId,
    uploaderRole: record.uploaderRole === "photographer" ? "photographer" : "guest",
    uploaderPhone: record.uploaderPhone,
    credit: record.credit,
    originalKey: record.originalKey,
    optimizedKey: record.optimizedKey,
    thumbnailKey: record.thumbnailKey,
    contentType: record.contentType,
    originalBytes: record.originalBytes,
    width: record.width,
    height: record.height,
    status: record.status === "hidden" ? "hidden" : "published",
    createdAt: record.createdAt.toISOString(),
  }
}

export class PrismaGuestPhotoRepository implements GuestPhotoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateGuestPhotoInput): Promise<GuestPhoto> {
    const photo = await this.prisma.guestPhoto.create({
      data: { ...input, status: "published" },
    })

    return toGuestPhoto(photo)
  }

  async findById(weddingId: string, id: string): Promise<GuestPhoto | null> {
    const photo = await this.prisma.guestPhoto.findFirst({
      where: { id, weddingId },
    })

    return photo ? toGuestPhoto(photo) : null
  }

  countPublished(weddingId: string): Promise<number> {
    return this.prisma.guestPhoto.count({
      where: { weddingId, status: "published" },
    })
  }

  async listPublished(input: {
    weddingId: string
    cursor: string | null
    limit: number
  }): Promise<GuestPhotoPage> {
    // Se pide una de más para saber si queda otra página sin contar la tabla.
    const photos = await this.prisma.guestPhoto.findMany({
      where: { weddingId: input.weddingId, status: "published" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    })
    const page = photos.slice(0, input.limit)

    return {
      photos: page.map(toGuestPhoto),
      nextCursor: photos.length > input.limit ? (page.at(-1)?.id ?? null) : null,
    }
  }

  async listByWedding(weddingId: string): Promise<GuestPhoto[]> {
    const photos = await this.prisma.guestPhoto.findMany({
      where: { weddingId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    })

    return photos.map(toGuestPhoto)
  }

  async updateStatus(input: {
    weddingId: string
    id: string
    status: GuestPhotoStatus
  }): Promise<GuestPhoto | null> {
    // El weddingId va en el where: nunca se toca una foto de otra boda.
    const { count } = await this.prisma.guestPhoto.updateMany({
      where: { id: input.id, weddingId: input.weddingId },
      data: { status: input.status },
    })

    return count > 0 ? this.findById(input.weddingId, input.id) : null
  }

  async delete(input: { weddingId: string; id: string }): Promise<boolean> {
    const { count } = await this.prisma.guestPhoto.deleteMany({
      where: { id: input.id, weddingId: input.weddingId },
    })

    return count > 0
  }
}
