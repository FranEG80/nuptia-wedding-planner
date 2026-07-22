import assert from "node:assert/strict"
import { test } from "node:test"

import { PrismaD1 } from "@prisma/adapter-d1"
import { getPlatformProxy } from "wrangler"

import type { PrismaClient as AppPrismaClient } from "@generated/prisma/client"
import { PrismaClient } from "@generated/prisma-seed/client"
import { createBindingD1BatchDatabase } from "@/core/db/d1-batch"
import { PrismaGuestRepository } from "@/domains/guests/adapters/prisma/prisma-guest.repository"
import { PrismaTableRepository } from "@/domains/guests/adapters/prisma/prisma-table.repository"

test("las mesas y los asientos se crean, reasignan y borran correctamente", async () => {
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

  try {
    const party = await guestRepository.createInvitationParty({
      weddingId: "demo-wedding",
      groupName: "Prueba asientos",
      guests: [
        {
          firstName: "Prueba",
          lastName: "Asientos",
          email: "prueba.asientos@example.com",
          isRecipient: true,
        },
      ],
    })
    partyIds.push(party.id)
    const guest = party.guests[0]

    const tableA = await tableRepository.create({
      weddingId: "demo-wedding",
      name: "Mesa test A",
      capacity: 4,
    })
    tableIds.push(tableA.id)
    const tableB = await tableRepository.create({
      weddingId: "demo-wedding",
      name: "Mesa test B",
      capacity: 1,
    })
    tableIds.push(tableB.id)

    const assigned = await guestRepository.assignSeat(
      guest.id,
      "demo-wedding",
      tableA.id,
    )
    assert.equal(assigned?.seat?.tableId, tableA.id)

    const reassigned = await guestRepository.assignSeat(
      guest.id,
      "demo-wedding",
      tableB.id,
    )
    assert.equal(reassigned?.seat?.tableId, tableB.id)

    const seatsForGuest = await db
      .prepare("SELECT COUNT(*) as count FROM wedding_seats WHERE guestId = ?")
      .bind(guest.id)
      .first<{ count: number }>()
    assert.equal(seatsForGuest?.count, 1)

    const unassigned = await guestRepository.unassignSeat(guest.id, "demo-wedding")
    assert.equal(unassigned?.seat, null)

    const reassignedAgain = await guestRepository.assignSeat(
      guest.id,
      "demo-wedding",
      tableA.id,
    )
    assert.equal(reassignedAgain?.seat?.tableId, tableA.id)

    const secondParty = await guestRepository.createInvitationParty({
      weddingId: "demo-wedding",
      groupName: "Prueba asientos 2",
      guests: [
        {
          firstName: "Segundo",
          lastName: "Asientos",
          email: "segundo.asientos@example.com",
          isRecipient: true,
        },
      ],
    })
    partyIds.push(secondParty.id)
    await guestRepository.assignSeat(secondParty.guests[0].id, "demo-wedding", tableB.id)

    await assert.rejects(
      () => guestRepository.assignSeat(guest.id, "demo-wedding", tableB.id),
      /está llena/i,
    )

    const deletedTable = await tableRepository.delete(tableA.id, "demo-wedding")
    assert.equal(deletedTable, true)

    const seatsAfterTableDelete = await db
      .prepare("SELECT COUNT(*) as count FROM wedding_seats WHERE guestId = ?")
      .bind(guest.id)
      .first<{ count: number }>()
    assert.equal(seatsAfterTableDelete?.count, 0)

    const guestAfterTableDelete = await guestRepository.findById(guest.id)
    assert.equal(guestAfterTableDelete?.seat, null)

    const deletedParty = await guestRepository.deleteInvitationParty(
      party.id,
      "demo-wedding",
    )
    assert.equal(deletedParty, true)

    const guestAfterPartyDelete = await guestRepository.findById(guest.id)
    assert.equal(guestAfterPartyDelete, null)
    partyIds.length = 0
  } finally {
    for (const tableId of tableIds) {
      await db.prepare("DELETE FROM wedding_seats WHERE tableId = ?").bind(tableId).run()
      await db.prepare("DELETE FROM wedding_tables WHERE id = ?").bind(tableId).run()
    }

    for (const partyId of partyIds) {
      await db.prepare("DELETE FROM guests WHERE partyId = ?").bind(partyId).run()
      await db
        .prepare("DELETE FROM guest_parties WHERE id = ?")
        .bind(partyId)
        .run()
    }

    await prisma.$disconnect()
    await platform.dispose()
  }
})
