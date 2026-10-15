import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { PrismaD1 } from "@prisma/adapter-d1"
import sharp from "sharp"
import { getPlatformProxy } from "wrangler"

import type { PrismaClient as AppPrismaClient } from "@generated/prisma/client"
import { PrismaClient } from "@generated/prisma-seed/client"
import { PrismaGuestPhotoRepository } from "@/domains/guest-photos/adapters/prisma/prisma-guest-photo.repository"
import { LocalGuestPhotoStorage, handleLocalGuestPhotoUpload } from "@/domains/guest-photos/adapters/r2/local-guest-photo-storage"
import { sharpGuestPhotoImageProcessor } from "@/domains/guest-photos/adapters/sharp/sharp-guest-photo-image-processor"
import { requestGuestPhotoUploadUseCase } from "@/domains/guest-photos/application/use-cases/request-guest-photo-upload.use-case"
import { completeGuestPhotoUploadUseCase } from "@/domains/guest-photos/application/use-cases/complete-guest-photo-upload.use-case"
import { deleteGuestPhotoUseCase } from "@/domains/guest-photos/application/use-cases/delete-guest-photo.use-case"
import { guestPhotoKeys } from "@/domains/guest-photos/domain/guest-photo-rules"
import { PrismaGuestRepository } from "@/domains/guests/adapters/prisma/prisma-guest.repository"
import { createBindingD1BatchDatabase } from "@/core/db/d1-batch"

test("sube, procesa, publica y borra una foto con R2 y D1 locales", async () => {
  const platform = await getPlatformProxy<Pick<CloudflareEnv, "DB" | "MEDIA_BUCKET">>({
    configPath: "wrangler.jsonc", persist: true, remoteBindings: false,
  })
  const prisma = new PrismaClient({ adapter: new PrismaD1(platform.env.DB) })
  const appPrisma = prisma as unknown as AppPrismaClient
  const guestPhotoRepository = new PrismaGuestPhotoRepository(appPrisma)
  const guestRepository = new PrismaGuestRepository(appPrisma, createBindingD1BatchDatabase(platform.env.DB))
  const photoId = randomUUID()
  const weddingId = "demo-wedding"
  const keys = guestPhotoKeys(weddingId, photoId, "jpg")
  const secret = "test-local-r2-and-d1-secret-at-least-32-chars"
  const storage = new LocalGuestPhotoStorage(platform.env.MEDIA_BUCKET, secret)

  try {
    const guest = await prisma.guest.findFirstOrThrow({ where: { weddingId } })
    const original = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#c8a27a" } }).jpeg().toBuffer()
    const claim = { role: "guest", guestId: guest.id } as const
    const context = { weddingId, claim, guestRepository, photographerPhoneKeys: [] }
    const ready = await requestGuestPhotoUploadUseCase({
      ...context, storage, createPhotoId: () => photoId,
      file: { contentType: "image/jpeg", size: original.byteLength },
    })
    assert.equal(ready.status, "ready")
    if (ready.status !== "ready") assert.fail("no se autorizó la subida")

    const uploaded = await handleLocalGuestPhotoUpload(new Request(new URL(ready.uploadUrl, "http://localhost:3000"), {
      method: "PUT", body: new Uint8Array(original), headers: { "Content-Type": "image/jpeg" },
    }), storage, secret)
    assert.equal(uploaded.status, 204)
    assert.deepEqual(await storage.readBytes(keys.original), new Uint8Array(original))

    const input = {
      ...context, photoId, contentType: "image/jpeg", creditChoice: "individual" as const,
      storage, guestPhotoRepository, imageProcessor: sharpGuestPhotoImageProcessor,
      resolveUrl: (key: string) => `/api/media/files/${key}`, photographerCredit: null,
    }
    const published = await completeGuestPhotoUploadUseCase(input)
    assert.equal(published.status, "published")
    const saved = await guestPhotoRepository.findById(weddingId, photoId)
    assert.equal(saved?.guestId, guest.id)
    assert.equal(saved?.originalBytes, original.byteLength)
    assert.equal(saved?.status, "published")
    assert.deepEqual([saved?.width, saved?.height], [1200, 800])
    assert.ok((await guestPhotoRepository.listPublished({ weddingId, cursor: null, limit: 60 })).photos.some(photo => photo.id === photoId))
    for (const key of [keys.optimized, keys.thumbnail]) {
      const bytes = await storage.readBytes(key)
      assert.ok(bytes)
      assert.equal((await sharp(bytes).metadata()).format, "webp")
    }
    assert.deepEqual(await completeGuestPhotoUploadUseCase(input), published)

    const deleted = await deleteGuestPhotoUseCase({ weddingId, photoId, guestPhotoRepository, storage })
    assert.equal(deleted.status, "deleted")
    assert.equal(await guestPhotoRepository.findById(weddingId, photoId), null)
    for (const key of Object.values(keys)) assert.equal(await storage.readBytes(key), null)
  } finally {
    await prisma.guestPhoto.deleteMany({ where: { id: photoId } })
    await Promise.all(Object.values(keys).map(key => storage.delete(key)))
    await prisma.$disconnect()
    await platform.dispose()
  }
})
