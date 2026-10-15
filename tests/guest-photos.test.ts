import assert from "node:assert/strict"
import { describe, it } from "node:test"

import sharp from "sharp"

import { sharpGuestPhotoImageProcessor } from "@/domains/guest-photos/adapters/sharp/sharp-guest-photo-image-processor"
import { completeGuestPhotoUploadUseCase } from "@/domains/guest-photos/application/use-cases/complete-guest-photo-upload.use-case"
import { listGuestPhotosUseCase } from "@/domains/guest-photos/application/use-cases/list-guest-photos.use-case"
import { requestGuestPhotoUploadUseCase } from "@/domains/guest-photos/application/use-cases/request-guest-photo-upload.use-case"
import type { GuestPhoto } from "@/domains/guest-photos/domain/guest-photo"
import {
  R2S3MediaObjectStorage,
  normalizeR2AccountId,
} from "@/domains/media/adapters/r2/r2-s3-media-object-storage"
import { GUEST_PHOTO_MAX_BYTES } from "@/domains/guest-photos/domain/guest-photo-rules"
import type { GuestPhotoRepository } from "@/domains/guest-photos/domain/ports/guest-photo.repository"
import {
  InvalidGuestPhotoImageError,
  type GuestPhotoImageProcessor,
} from "@/domains/guest-photos/domain/ports/guest-photo-image-processor"
import type { GuestPhotoStorage } from "@/domains/guest-photos/domain/ports/guest-photo-storage"
import { getWallPartyName } from "@/domains/guests/application/format-guest-names"
import { parsePhoneList } from "@/domains/guests/domain/phone-key"
import type {
  GuestRepository,
  GuestWallIdentity,
} from "@/domains/guests/domain/ports/guest.repository"

const WEDDING_ID = "wedding-1"
const PHOTO_ID = "6f1c2b8e-4a5d-4c3b-9e2f-1a2b3c4d5e6f"
const ORIGINAL_KEY = `weddings/${WEDDING_ID}/guest-photos/${PHOTO_ID}/original.jpg`
const OPTIMIZED_KEY = `weddings/${WEDDING_ID}/guest-photos/${PHOTO_ID}/optimized.webp`
const THUMBNAIL_KEY = `weddings/${WEDDING_ID}/guest-photos/${PHOTO_ID}/thumbnail.webp`

const ana: GuestWallIdentity = {
  id: "guest-ana",
  firstName: "Ana",
  fullName: "Ana García",
  partyName: "Ana y Juan",
}

function guestRepositoryWith(identities: GuestWallIdentity[]) {
  return {
    async findWallIdentity(weddingId: string, guestId: string) {
      return weddingId === WEDDING_ID
        ? (identities.find((identity) => identity.id === guestId) ?? null)
        : null
    },
  } satisfies Pick<GuestRepository, "findWallIdentity">
}

function memoryStorage(initial: Record<string, Uint8Array<ArrayBuffer>> = {}) {
  const objects = new Map(Object.entries(initial))
  const deleted: string[] = []

  const storage: GuestPhotoStorage = {
    async createSignedUploadUrl(input) {
      return `https://r2.test/${input.key}?type=${input.contentType}&ttl=${input.expiresInSeconds}`
    },
    async readBytes(key) {
      return objects.get(key) ?? null
    },
    async put(input) {
      objects.set(input.key, input.body)
    },
    async delete(key) {
      deleted.push(key)
      objects.delete(key)
    },
  }

  return { storage, objects, deleted }
}

function memoryPhotoRepository(initial: GuestPhoto[] = []) {
  const photos = [...initial]

  const repository: GuestPhotoRepository = {
    async create(input) {
      const photo: GuestPhoto = {
        ...input,
        status: "published",
        createdAt: new Date(Date.UTC(2026, 9, 17, 18, photos.length)).toISOString(),
      }
      photos.push(photo)
      return photo
    },
    async findById(weddingId, id) {
      return photos.find((photo) => photo.weddingId === weddingId && photo.id === id) ?? null
    },
    async countPublished(weddingId) {
      return photos.filter((photo) => photo.weddingId === weddingId).length
    },
    async listPublished(input) {
      const ordered = photos
        .filter((photo) => photo.weddingId === input.weddingId)
        .reverse()
      const start = input.cursor
        ? ordered.findIndex((photo) => photo.id === input.cursor) + 1
        : 0
      const page = ordered.slice(start, start + input.limit)

      return {
        photos: page,
        nextCursor: start + input.limit < ordered.length ? (page.at(-1)?.id ?? null) : null,
      }
    },
    async listByWedding(weddingId) {
      return photos.filter((photo) => photo.weddingId === weddingId).reverse()
    },
    async updateStatus(input) {
      const photo = photos.find(
        (candidate) => candidate.weddingId === input.weddingId && candidate.id === input.id,
      )

      if (!photo) {
        return null
      }

      photo.status = input.status
      return photo
    },
    async delete(input) {
      const index = photos.findIndex(
        (candidate) => candidate.weddingId === input.weddingId && candidate.id === input.id,
      )

      if (index === -1) {
        return false
      }

      photos.splice(index, 1)
      return true
    },
  }

  return { repository, photos }
}

const fakeProcessor: GuestPhotoImageProcessor = {
  async process() {
    return {
      optimized: {
        bytes: new Uint8Array([1, 2, 3]),
        width: 2048,
        height: 1365,
        contentType: "image/webp",
      },
      thumbnail: {
        bytes: new Uint8Array([4, 5]),
        width: 640,
        height: 640,
        contentType: "image/webp",
      },
    }
  },
}

const failingProcessor: GuestPhotoImageProcessor = {
  async process() {
    throw new InvalidGuestPhotoImageError()
  },
}

const dtoContext = {
  resolveUrl: (key: string) => `https://fotos.test/${key}`,
  photographerCredit: "María Daniela y Nacho",
}

function complete(
  overrides: Partial<Parameters<typeof completeGuestPhotoUploadUseCase>[0]> = {},
) {
  const { storage } = memoryStorage({ [ORIGINAL_KEY]: new Uint8Array([9, 9, 9, 9]) })
  const { repository } = memoryPhotoRepository()

  return completeGuestPhotoUploadUseCase({
    weddingId: WEDDING_ID,
    claim: { role: "guest", guestId: ana.id },
    photoId: PHOTO_ID,
    contentType: "image/jpeg",
    creditChoice: "individual",
    guestRepository: guestRepositoryWith([ana]),
    photographerPhoneKeys: parsePhoneList("677889900"),
    storage,
    imageProcessor: fakeProcessor,
    guestPhotoRepository: repository,
    ...dtoContext,
    ...overrides,
  })
}

describe("getWallPartyName", () => {
  it("usa el nombre de la invitación o une los nombres de pila", () => {
    assert.equal(
      getWallPartyName({
        invitationName: "",
        guests: [
          { firstName: "Ana", name: "Ana García" },
          { firstName: "Juan", name: "Juan Pérez" },
        ],
      }),
      "Ana y Juan",
    )
    assert.equal(
      getWallPartyName({
        invitationName: "Familia García",
        guests: [
          { firstName: "Ana", name: "Ana García" },
          { firstName: "Juan", name: "Juan Pérez" },
        ],
      }),
      "Familia García",
    )
  })

  it("no hay nombre de grupo en invitaciones de una persona", () => {
    assert.equal(
      getWallPartyName({ invitationName: "Ana", guests: [{ firstName: "Ana", name: "Ana" }] }),
      null,
    )
  })
})

describe("requestGuestPhotoUploadUseCase", () => {
  const base = {
    weddingId: WEDDING_ID,
    guestRepository: guestRepositoryWith([ana]),
    photographerPhoneKeys: parsePhoneList("677889900"),
    createPhotoId: () => PHOTO_ID,
  }

  it("firma la subida del original de un invitado de la boda", async () => {
    const { storage } = memoryStorage()

    assert.deepEqual(
      await requestGuestPhotoUploadUseCase({
        ...base,
        storage,
        claim: { role: "guest", guestId: ana.id },
        file: { contentType: "image/jpeg", size: 4_000_000 },
      }),
      {
        status: "ready",
        photoId: PHOTO_ID,
        uploadUrl: `https://r2.test/${ORIGINAL_KEY}?type=image/jpeg&ttl=900`,
      },
    )
  })

  it("acepta al fotógrafo por su teléfono aunque no sea invitado", async () => {
    const { storage } = memoryStorage()
    const result = await requestGuestPhotoUploadUseCase({
      ...base,
      storage,
      claim: { role: "photographer", phone: "+34 677 88 99 00" },
      file: { contentType: "image/png", size: 1000 },
    })

    assert.equal(result.status, "ready")
  })

  it("rechaza invitados de otra boda y teléfonos que no son de fotógrafo", async () => {
    const { storage } = memoryStorage()
    const file = { contentType: "image/jpeg", size: 1000 }

    assert.deepEqual(
      await requestGuestPhotoUploadUseCase({
        ...base,
        storage,
        claim: { role: "guest", guestId: "guest-desconocido" },
        file,
      }),
      { status: "unknown_uploader" },
    )
    assert.deepEqual(
      await requestGuestPhotoUploadUseCase({
        ...base,
        storage,
        claim: { role: "photographer", phone: "600000000" },
        file,
      }),
      { status: "unknown_uploader" },
    )
  })

  it("rechaza formatos no admitidos y archivos demasiado grandes", async () => {
    const { storage } = memoryStorage()
    const claim = { role: "guest", guestId: ana.id } as const

    assert.deepEqual(
      await requestGuestPhotoUploadUseCase({
        ...base,
        storage,
        claim,
        file: { contentType: "image/heic", size: 1000 },
      }),
      { status: "unsupported_type" },
    )
    assert.deepEqual(
      await requestGuestPhotoUploadUseCase({
        ...base,
        storage,
        claim,
        file: { contentType: "image/jpeg", size: GUEST_PHOTO_MAX_BYTES + 1 },
      }),
      { status: "too_large" },
    )
  })
})

describe("completeGuestPhotoUploadUseCase", () => {
  it("guarda optimizada y miniatura y firma con el nombre del invitado", async () => {
    const { storage, objects } = memoryStorage({ [ORIGINAL_KEY]: new Uint8Array([9, 9, 9, 9]) })
    const { repository, photos } = memoryPhotoRepository()
    const result = await complete({ storage, guestPhotoRepository: repository })

    assert.deepEqual(result, {
      status: "published",
      photo: {
        id: PHOTO_ID,
        thumbnailUrl: `https://fotos.test/${THUMBNAIL_KEY}`,
        url: `https://fotos.test/${OPTIMIZED_KEY}`,
        width: 2048,
        height: 1365,
        credit: "Ana",
      },
    })
    assert.deepEqual([...objects.keys()].sort(), [OPTIMIZED_KEY, ORIGINAL_KEY, THUMBNAIL_KEY])
    assert.equal(photos[0]?.guestId, ana.id)
    assert.equal(photos[0]?.originalBytes, 4)
    assert.equal(photos[0]?.uploaderPhone, null)
  })

  it("firma con el nombre de la invitación si el invitado lo elige", async () => {
    const result = await complete({ creditChoice: "party" })

    assert.equal(result.status === "published" && result.photo.credit, "Ana y Juan")
  })

  it("firma con el nombre que escribe el invitado, sin espacios de más", async () => {
    const result = await complete({
      creditChoice: "custom",
      customCredit: "  La tía   Ana  ",
    })

    assert.equal(result.status === "published" && result.photo.credit, "La tía Ana")
  })

  it("recorta el nombre escrito a 60 caracteres", async () => {
    const result = await complete({ creditChoice: "custom", customCredit: "A".repeat(80) })

    assert.equal(result.status === "published" && result.photo.credit, "A".repeat(60))
  })

  it("un nombre escrito vacío firma con el nombre del invitado", async () => {
    const result = await complete({ creditChoice: "custom", customCredit: "   " })

    assert.equal(result.status === "published" && result.photo.credit, "Ana")
  })

  it("las fotos de fotógrafo guardan su teléfono y se firman al mostrarse", async () => {
    const { repository, photos } = memoryPhotoRepository()
    const result = await complete({
      claim: { role: "photographer", phone: " 677 88 99 00 " },
      guestPhotoRepository: repository,
    })

    assert.equal(result.status === "published" && result.photo.credit, "María Daniela y Nacho")
    assert.equal(photos[0]?.guestId, null)
    assert.equal(photos[0]?.credit, null)
    assert.equal(photos[0]?.uploaderRole, "photographer")
    assert.equal(photos[0]?.uploaderPhone, "677 88 99 00")
  })

  it("avisa si el original no llegó a R2", async () => {
    const { storage } = memoryStorage()

    assert.deepEqual(await complete({ storage }), { status: "not_uploaded" })
  })

  it("borra el original si no es una imagen válida", async () => {
    const { storage, objects, deleted } = memoryStorage({
      [ORIGINAL_KEY]: new Uint8Array([1]),
    })

    assert.deepEqual(await complete({ storage, imageProcessor: failingProcessor }), {
      status: "invalid_image",
    })
    assert.deepEqual(deleted, [ORIGINAL_KEY])
    assert.equal(objects.size, 0)
  })

  it("un reintento devuelve la foto ya publicada sin volver a procesarla", async () => {
    const { repository } = memoryPhotoRepository()
    await complete({ guestPhotoRepository: repository })

    const result = await complete({
      guestPhotoRepository: repository,
      imageProcessor: {
        async process() {
          assert.fail("no debería procesar otra vez")
        },
      },
    })

    assert.equal(result.status, "published")
  })

  it("no acepta ids de foto que no generó el servidor", async () => {
    assert.deepEqual(await complete({ photoId: "../../otra-boda" }), { status: "not_uploaded" })
  })
})

describe("listGuestPhotosUseCase", () => {
  it("pagina de la más reciente a la más antigua y da el total en la primera página", async () => {
    const { repository } = memoryPhotoRepository()

    for (const id of ["a", "b", "c"]) {
      await repository.create({
        id,
        weddingId: WEDDING_ID,
        guestId: null,
        uploaderRole: id === "b" ? "photographer" : "guest",
        uploaderPhone: null,
        credit: id === "b" ? null : `Invitado ${id}`,
        originalKey: `${id}/original.jpg`,
        optimizedKey: `${id}/optimized.webp`,
        thumbnailKey: `${id}/thumbnail.webp`,
        contentType: "image/jpeg",
        originalBytes: 10,
        width: 100,
        height: 100,
      })
    }

    const first = await listGuestPhotosUseCase({
      guestPhotoRepository: repository,
      weddingId: WEDDING_ID,
      cursor: null,
      limit: 2,
      ...dtoContext,
    })

    assert.deepEqual(
      first.photos.map((photo) => [photo.id, photo.credit]),
      [
        ["c", "Invitado c"],
        ["b", "María Daniela y Nacho"],
      ],
    )
    assert.equal(first.total, 3)
    assert.equal(first.nextCursor, "b")

    const second = await listGuestPhotosUseCase({
      guestPhotoRepository: repository,
      weddingId: WEDDING_ID,
      cursor: first.nextCursor,
      limit: 2,
      ...dtoContext,
    })

    assert.deepEqual(second.photos.map((photo) => photo.id), ["a"])
    assert.equal(second.total, null)
    assert.equal(second.nextCursor, null)
  })
})

describe("R2S3MediaObjectStorage", () => {
  it("firma un PUT directo a R2 con el Content-Type incluido en la firma", async () => {
    const storage = new R2S3MediaObjectStorage({
      accountId: "cuenta",
      accessKeyId: "clave",
      secretAccessKey: "secreto",
      bucketName: "nuptia-media",
    })
    const url = new URL(
      await storage.createSignedUploadUrl({
        key: ORIGINAL_KEY,
        contentType: "image/jpeg",
        expiresInSeconds: 900,
      }),
    )

    assert.equal(url.host, "cuenta.r2.cloudflarestorage.com")
    assert.equal(url.pathname, `/nuptia-media/${ORIGINAL_KEY}`)
    assert.equal(url.searchParams.get("X-Amz-Expires"), "900")
    assert.equal(url.searchParams.get("X-Amz-SignedHeaders"), "content-type;host")
    assert.match(url.searchParams.get("X-Amz-Signature") ?? "", /^[0-9a-f]{64}$/)
  })

  it("acepta como R2_ACCOUNT_ID el endpoint completo que enseña Cloudflare", async () => {
    const accountId = "0123456789abcdef0123456789abcdef"

    assert.equal(normalizeR2AccountId(accountId), accountId)
    assert.equal(
      normalizeR2AccountId(` https://${accountId}.r2.cloudflarestorage.com `),
      accountId,
    )

    const storage = new R2S3MediaObjectStorage({
      accountId: `https://${accountId}.r2.cloudflarestorage.com`,
      accessKeyId: "clave",
      secretAccessKey: "secreto",
      bucketName: "nuptia-media",
    })
    const url = new URL(
      await storage.createSignedUploadUrl({
        key: ORIGINAL_KEY,
        contentType: "image/jpeg",
        expiresInSeconds: 900,
      }),
    )

    assert.equal(url.host, `${accountId}.r2.cloudflarestorage.com`)
  })
})

describe("sharpGuestPhotoImageProcessor", () => {
  it("endereza la foto según el EXIF y genera WebP optimizada y miniatura cuadrada", async () => {
    // 3000×2000 con orientación 6: en realidad es una foto vertical.
    const original = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: "#c8a27a" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()

    const processed = await sharpGuestPhotoImageProcessor.process(original)

    assert.deepEqual(
      [processed.optimized.width, processed.optimized.height],
      [1365, 2048],
    )
    assert.deepEqual([processed.thumbnail.width, processed.thumbnail.height], [640, 640])

    const optimizedMetadata = await sharp(processed.optimized.bytes).metadata()
    assert.equal(optimizedMetadata.format, "webp")
    assert.equal(optimizedMetadata.orientation, undefined)
  })

  it("no agranda fotos pequeñas", async () => {
    const original = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#ffffff" },
    })
      .png()
      .toBuffer()

    const processed = await sharpGuestPhotoImageProcessor.process(original)

    assert.deepEqual([processed.optimized.width, processed.optimized.height], [800, 600])
  })

  it("rechaza archivos que no son imágenes", async () => {
    await assert.rejects(
      sharpGuestPhotoImageProcessor.process(new TextEncoder().encode("no soy una foto")),
      InvalidGuestPhotoImageError,
    )
  })
})
