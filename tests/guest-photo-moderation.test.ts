import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { deleteGuestPhotoUseCase } from "@/domains/guest-photos/application/use-cases/delete-guest-photo.use-case"
import { listWeddingGuestPhotosUseCase } from "@/domains/guest-photos/application/use-cases/list-wedding-guest-photos.use-case"
import { setGuestPhotoStatusUseCase } from "@/domains/guest-photos/application/use-cases/set-guest-photo-status.use-case"
import type { GuestPhoto } from "@/domains/guest-photos/domain/guest-photo"
import type { GuestPhotoRepository } from "@/domains/guest-photos/domain/ports/guest-photo.repository"

const WEDDING_ID = "wedding-1"
const OTHER_WEDDING_ID = "wedding-2"

const resolveUrl = (key: string) => `https://fotos.test/${key}`

function photo(overrides: Partial<GuestPhoto> & Pick<GuestPhoto, "id">): GuestPhoto {
  const base = `weddings/${overrides.weddingId ?? WEDDING_ID}/guest-photos/${overrides.id}`

  return {
    weddingId: WEDDING_ID,
    guestId: "guest-ana",
    uploaderRole: "guest",
    uploaderPhone: null,
    credit: "Ana García",
    originalKey: `${base}/original.jpg`,
    optimizedKey: `${base}/optimized.webp`,
    thumbnailKey: `${base}/thumbnail.webp`,
    contentType: "image/jpeg",
    originalBytes: 10,
    width: 2048,
    height: 1365,
    status: "published",
    createdAt: "2026-10-17T18:00:00.000Z",
    ...overrides,
  }
}

function memoryRepository(initial: GuestPhoto[]) {
  const photos = initial.map((item) => ({ ...item }))
  const updates: string[] = []

  const repository = {
    async findById(weddingId: string, id: string) {
      return photos.find((item) => item.weddingId === weddingId && item.id === id) ?? null
    },
    async listByWedding(weddingId: string) {
      return photos
        .filter((item) => item.weddingId === weddingId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async updateStatus(input: Parameters<GuestPhotoRepository["updateStatus"]>[0]) {
      const target = photos.find(
        (item) => item.weddingId === input.weddingId && item.id === input.id,
      )

      if (!target) {
        return null
      }

      updates.push(`${input.id}:${input.status}`)
      target.status = input.status
      return { ...target }
    },
    async delete(input: Parameters<GuestPhotoRepository["delete"]>[0]) {
      const index = photos.findIndex(
        (item) => item.weddingId === input.weddingId && item.id === input.id,
      )

      if (index === -1) {
        return false
      }

      photos.splice(index, 1)
      return true
    },
  } satisfies Pick<
    GuestPhotoRepository,
    "findById" | "listByWedding" | "updateStatus" | "delete"
  >

  return { repository, photos, updates }
}

describe("listWeddingGuestPhotosUseCase", () => {
  it("lista publicadas y ocultas de la boda, de la más reciente a la más antigua", async () => {
    const { repository } = memoryRepository([
      photo({ id: "a", createdAt: "2026-10-17T18:00:00.000Z" }),
      photo({
        id: "b",
        status: "hidden",
        uploaderRole: "photographer",
        uploaderPhone: "+34677889900",
        guestId: null,
        credit: null,
        createdAt: "2026-10-17T19:00:00.000Z",
      }),
      photo({ id: "c", weddingId: OTHER_WEDDING_ID }),
    ])

    const photos = await listWeddingGuestPhotosUseCase({
      guestPhotoRepository: repository,
      weddingId: WEDDING_ID,
      resolveUrl,
    })

    assert.deepEqual(photos, [
      {
        id: "b",
        thumbnailUrl: "https://fotos.test/weddings/wedding-1/guest-photos/b/thumbnail.webp",
        url: "https://fotos.test/weddings/wedding-1/guest-photos/b/optimized.webp",
        credit: null,
        uploaderRole: "photographer",
        status: "hidden",
        createdAt: "2026-10-17T19:00:00.000Z",
      },
      {
        id: "a",
        thumbnailUrl: "https://fotos.test/weddings/wedding-1/guest-photos/a/thumbnail.webp",
        url: "https://fotos.test/weddings/wedding-1/guest-photos/a/optimized.webp",
        credit: "Ana García",
        uploaderRole: "guest",
        status: "published",
        createdAt: "2026-10-17T18:00:00.000Z",
      },
    ])
  })
})

describe("setGuestPhotoStatusUseCase", () => {
  it("oculta una foto publicada y la vuelve a mostrar", async () => {
    const { repository, photos, updates } = memoryRepository([photo({ id: "a" })])

    const hidden = await setGuestPhotoStatusUseCase({
      guestPhotoRepository: repository,
      weddingId: WEDDING_ID,
      photoId: "a",
      photoStatus: "hidden",
      resolveUrl,
    })

    assert.equal(hidden.status, "updated")
    assert.equal(hidden.status === "updated" && hidden.photo.status, "hidden")
    assert.equal(photos[0].status, "hidden")

    const shown = await setGuestPhotoStatusUseCase({
      guestPhotoRepository: repository,
      weddingId: WEDDING_ID,
      photoId: "a",
      photoStatus: "published",
      resolveUrl,
    })

    assert.equal(shown.status === "updated" && shown.photo.status, "published")
    assert.deepEqual(updates, ["a:hidden", "a:published"])
  })

  it("no escribe si la foto ya tiene ese estado", async () => {
    const { repository, updates } = memoryRepository([photo({ id: "a", status: "hidden" })])

    const result = await setGuestPhotoStatusUseCase({
      guestPhotoRepository: repository,
      weddingId: WEDDING_ID,
      photoId: "a",
      photoStatus: "hidden",
      resolveUrl,
    })

    assert.equal(result.status === "updated" && result.photo.status, "hidden")
    assert.deepEqual(updates, [])
  })

  it("no toca fotos de otra boda ni ids que no existen", async () => {
    const { repository, photos, updates } = memoryRepository([
      photo({ id: "ajena", weddingId: OTHER_WEDDING_ID }),
    ])

    for (const photoId of ["ajena", "no-existe"]) {
      const result = await setGuestPhotoStatusUseCase({
        guestPhotoRepository: repository,
        weddingId: WEDDING_ID,
        photoId,
        photoStatus: "hidden",
        resolveUrl,
      })

      assert.deepEqual(result, { status: "not_found" })
    }

    assert.equal(photos[0].status, "published")
    assert.deepEqual(updates, [])
  })
})

function memoryStorage(failingKeys: string[] = []) {
  const deleted: string[] = []

  return {
    deleted,
    storage: {
      async delete(key: string) {
        if (failingKeys.includes(key)) {
          throw new Error("R2 no responde")
        }

        deleted.push(key)
      },
    },
  }
}

describe("deleteGuestPhotoUseCase", () => {
  it("borra la fila y las tres versiones en R2", async () => {
    const target = photo({ id: "a" })
    const { repository, photos } = memoryRepository([target, photo({ id: "b" })])
    const { storage, deleted } = memoryStorage()

    const result = await deleteGuestPhotoUseCase({
      guestPhotoRepository: repository,
      storage,
      weddingId: WEDDING_ID,
      photoId: "a",
    })

    assert.deepEqual(result, { status: "deleted", photoId: "a", failedKeys: [] })
    assert.deepEqual(
      photos.map((item) => item.id),
      ["b"],
    )
    assert.deepEqual(deleted, [target.originalKey, target.optimizedKey, target.thumbnailKey])
  })

  it("si R2 falla la foto sale igual de la galería y avisa de los archivos huérfanos", async () => {
    const target = photo({ id: "a" })
    const { repository, photos } = memoryRepository([target])
    const { storage, deleted } = memoryStorage([target.originalKey])

    const result = await deleteGuestPhotoUseCase({
      guestPhotoRepository: repository,
      storage,
      weddingId: WEDDING_ID,
      photoId: "a",
    })

    assert.deepEqual(result, {
      status: "deleted",
      photoId: "a",
      failedKeys: [target.originalKey],
    })
    assert.equal(photos.length, 0)
    assert.deepEqual(deleted, [target.optimizedKey, target.thumbnailKey])
  })

  it("no borra fotos de otra boda ni ids que no existen", async () => {
    const { repository, photos } = memoryRepository([
      photo({ id: "ajena", weddingId: OTHER_WEDDING_ID }),
    ])
    const { storage, deleted } = memoryStorage()

    for (const photoId of ["ajena", "no-existe"]) {
      const result = await deleteGuestPhotoUseCase({
        guestPhotoRepository: repository,
        storage,
        weddingId: WEDDING_ID,
        photoId,
      })

      assert.deepEqual(result, { status: "not_found" })
    }

    assert.equal(photos.length, 1)
    assert.deepEqual(deleted, [])
  })
})
