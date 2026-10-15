import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { PrismaD1 } from "@prisma/adapter-d1"
import { getPlatformProxy } from "wrangler"

import type { PrismaClient as AppPrismaClient } from "@generated/prisma/client"
import { PrismaClient } from "@generated/prisma-seed/client"
import { PrismaGuestbookRepository } from "@/domains/wedding-sites/adapters/prisma/prisma-guestbook.repository"

test("los novios ocultan, muestran y borran firmas del tablón en D1", async () => {
  const platform = await getPlatformProxy<Pick<CloudflareEnv, "DB">>({
    configPath: "wrangler.jsonc",
    persist: true,
    remoteBindings: false,
  })
  const db = platform.env.DB
  const prisma = new PrismaClient({ adapter: new PrismaD1(db) })
  const repository = new PrismaGuestbookRepository(prisma as unknown as AppPrismaClient)
  const marker = `Firma de prueba ${randomUUID()}`
  const createdIds: string[] = []

  async function publicMessages() {
    const { signatures } = await repository.listPage("demo-wedding", { offset: 0, limit: 500 })

    return signatures
      .filter((signature) => signature.message.startsWith(marker))
      .map((signature) => signature.message)
  }

  try {
    const guest = await prisma.guest.findFirstOrThrow({
      where: { weddingId: "demo-wedding" },
      select: { id: true, name: true },
    })

    for (const suffix of ["uno", "dos"]) {
      const signature = await repository.create({
        weddingId: "demo-wedding",
        guestId: guest.id,
        authorName: "Prueba",
        message: `${marker} ${suffix}`,
      })
      createdIds.push(signature.id)
    }

    const [first, second] = createdIds as [string, string]

    assert.equal(await repository.setStatus("demo-wedding", first, "hidden"), true)
    assert.deepEqual(await publicMessages(), [`${marker} dos`])

    // Las dos se crean en el mismo instante: se comparan sin depender del orden.
    const moderation = new Map(
      (await repository.listForModeration("demo-wedding"))
        .filter((signature) => createdIds.includes(signature.id))
        .map(({ id, status, guestId, guestName }) => [id, { status, guestId, guestName }]),
    )
    assert.deepEqual(
      moderation,
      new Map([
        [first, { status: "hidden", guestId: guest.id, guestName: guest.name }],
        [second, { status: "published", guestId: guest.id, guestName: guest.name }],
      ]),
    )

    assert.equal(await repository.setStatus("demo-wedding", first, "published"), true)
    assert.deepEqual((await publicMessages()).sort(), [`${marker} dos`, `${marker} uno`])

    // Otra boda no puede tocar estas firmas.
    assert.equal(await repository.setStatus("otra-boda", first, "hidden"), false)
    assert.equal(await repository.delete("otra-boda", first), false)

    assert.equal(await repository.delete("demo-wedding", first), true)
    assert.equal(await repository.delete("demo-wedding", first), false)
    assert.deepEqual(await publicMessages(), [`${marker} dos`])
  } finally {
    await prisma.guestbookSignature.deleteMany({ where: { id: { in: createdIds } } })
    await prisma.$disconnect()
    await platform.dispose()
  }
})
