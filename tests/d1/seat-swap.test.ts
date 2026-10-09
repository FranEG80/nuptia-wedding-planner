import assert from "node:assert/strict"
import { test } from "node:test"

import { PrismaD1 } from "@prisma/adapter-d1"
import { getPlatformProxy } from "wrangler"

import type { PrismaClient as AppPrismaClient } from "@generated/prisma/client"
import { PrismaClient } from "@generated/prisma-seed/client"
import { createBindingD1BatchDatabase } from "@/core/db/d1-batch"
import { PrismaGuestRepository } from "@/domains/guests/adapters/prisma/prisma-guest.repository"
import { PrismaTableRepository } from "@/domains/guests/adapters/prisma/prisma-table.repository"

test("intercambiar invitados en una mesa cambia solo su posición", async () => {
  const platform = await getPlatformProxy<Pick<CloudflareEnv, "DB">>({
    configPath: "wrangler.jsonc",
    persist: true,
    remoteBindings: false,
  })
  const db = platform.env.DB
  const prisma = new PrismaClient({ adapter: new PrismaD1(db) })
  const d1 = createBindingD1BatchDatabase(db)
  const guestRepository = new PrismaGuestRepository(
    prisma as unknown as AppPrismaClient,
    d1,
  )
  const tableRepository = new PrismaTableRepository(
    prisma as unknown as AppPrismaClient,
    d1,
  )

  const partyIds: string[] = []
  const tableIds: string[] = []

  async function positionsAt(tableId: string) {
    const { results } = await db
      .prepare(
        "SELECT guestId, position FROM wedding_seats WHERE tableId = ? ORDER BY position",
      )
      .bind(tableId)
      .all<{ guestId: string; position: number }>()

    return results.map((row) => [row.guestId, row.position])
  }

  try {
    const party = await guestRepository.createInvitationParty({
      weddingId: "demo-wedding",
      groupName: "Prueba orden asientos",
      guests: [
        { firstName: "Ana", lastName: "Orden", email: "ana.orden@example.com", isRecipient: true },
        { firstName: "Beto", lastName: "Orden", email: null, isRecipient: false },
        { firstName: "Carla", lastName: "Orden", email: null, isRecipient: false },
      ],
    })
    partyIds.push(party.id)
    const [ana, beto, carla] = party.guests

    const tableA = await tableRepository.create({
      weddingId: "demo-wedding",
      name: "Mesa orden A",
      capacity: 5,
    })
    tableIds.push(tableA.id)
    const tableB = await tableRepository.create({
      weddingId: "demo-wedding",
      name: "Mesa orden B",
      capacity: 5,
    })
    tableIds.push(tableB.id)

    await guestRepository.assignSeat(ana.id, "demo-wedding", tableA.id)
    await guestRepository.assignSeat(beto.id, "demo-wedding", tableA.id)
    await guestRepository.assignSeat(carla.id, "demo-wedding", tableB.id)

    assert.deepEqual(await positionsAt(tableA.id), [
      [ana.id, 1],
      [beto.id, 2],
    ])

    const swapped = await guestRepository.swapSeats(ana.id, beto.id, "demo-wedding")
    assert.deepEqual(swapped, [
      { guestId: ana.id, position: 2 },
      { guestId: beto.id, position: 1 },
    ])
    assert.deepEqual(await positionsAt(tableA.id), [
      [beto.id, 1],
      [ana.id, 2],
    ])

    const swappedBack = await guestRepository.swapSeats(beto.id, ana.id, "demo-wedding")
    assert.deepEqual(swappedBack, [
      { guestId: beto.id, position: 2 },
      { guestId: ana.id, position: 1 },
    ])

    assert.equal(
      await guestRepository.swapSeats(ana.id, carla.id, "demo-wedding"),
      null,
      "no se intercambian invitados de mesas distintas",
    )
    assert.equal(
      await guestRepository.swapSeats(ana.id, beto.id, "otra-boda"),
      null,
      "no se intercambian invitados de otra boda",
    )
    assert.equal(await guestRepository.swapSeats(ana.id, ana.id, "demo-wedding"), null)
  } finally {
    for (const tableId of tableIds) {
      await db.prepare("DELETE FROM wedding_seats WHERE tableId = ?").bind(tableId).run()
      await db.prepare("DELETE FROM wedding_tables WHERE id = ?").bind(tableId).run()
    }

    for (const partyId of partyIds) {
      await db.prepare("DELETE FROM guests WHERE partyId = ?").bind(partyId).run()
      await db.prepare("DELETE FROM guest_parties WHERE id = ?").bind(partyId).run()
    }

    await prisma.$disconnect()
    await platform.dispose()
  }
})
