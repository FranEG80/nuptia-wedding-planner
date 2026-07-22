import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { PrismaD1 } from "@prisma/adapter-d1"
import { getPlatformProxy } from "wrangler"

import type { PrismaClient as AppPrismaClient } from "@generated/prisma/client"
import { PrismaClient } from "@generated/prisma-seed/client"
import { createBindingD1BatchDatabase } from "@/core/db/d1-batch"
import { PrismaGuestRepository } from "@/domains/guests/adapters/prisma/prisma-guest.repository"

test("el repositorio gestiona una invitación individual y una pareja completa", async () => {
  const platform = await getPlatformProxy<Pick<CloudflareEnv, "DB">>({
    configPath: "wrangler.jsonc",
    persist: true,
    remoteBindings: false,
  })
  const db = platform.env.DB
  const prisma = new PrismaClient({ adapter: new PrismaD1(db) })
  const repository = new PrismaGuestRepository(
    prisma as unknown as AppPrismaClient,
    createBindingD1BatchDatabase(db),
  )
  const partyIds: string[] = []
  const seatId = `test-seat-${randomUUID()}`

  try {
    const single = await repository.createInvitationParty({
      weddingId: "demo-wedding",
      groupName: "Individual",
      guests: [
        {
          firstName: "Invitada",
          lastName: "individual",
          email: "individual@example.com",
          isRecipient: true,
        },
      ],
    })
    partyIds.push(single.id)

    assert.equal(single.guests.length, 1)
    assert.equal(single.guests[0].role, "primary")

    let pair = await repository.createInvitationParty({
      weddingId: "demo-wedding",
      groupName: "Pareja",
      guests: [
        {
          firstName: "Primera",
          lastName: "persona",
          email: null,
          phone: null,
          isRecipient: false,
        },
        {
          firstName: "Segunda",
          lastName: "persona",
          email: null,
          phone: "+34600000000",
          isRecipient: true,
        },
      ],
    })
    partyIds.push(pair.id)

    assert.deepEqual(
      pair.guests.map((guest) => guest.name),
      ["Primera persona", "Segunda persona"],
    )
    assert.equal(pair.guests[1].role, "primary")

    const firstGuest = pair.guests[0]
    const secondGuest = pair.guests[1]
    const seatPosition = 10_000 + Math.floor(Math.random() * 1_000_000)
    const now = new Date().toISOString()

    await db
      .prepare(
        `INSERT INTO wedding_seats
          (id, tableId, position, guestId, createdAt, updatedAt)
         VALUES (?, 'demo-table-1', ?, ?, ?, ?)`,
      )
      .bind(seatId, seatPosition, firstGuest.id, now, now)
      .run()

    pair = (await repository.respondToPartyWithDetails(pair.inviteToken, {
      guests: [
        {
          guestId: firstGuest.id,
          attending: true,
          notes: "Sin gluten",
          menuSelections: [
            {
              menuDishId: "demo-menu-dish-principal",
              dishOptionId: "demo-opt-carne",
            },
          ],
        },
        {
          guestId: secondGuest.id,
          attending: true,
          notes: "Sin lactosa",
          menuSelections: [
            {
              menuDishId: "demo-menu-dish-principal",
              dishOptionId: "demo-opt-pescado",
            },
          ],
        },
      ],
      message: "Respondemos los dos",
    }))!

    assert.deepEqual(
      pair.guests.map((guest) => guest.rsvp),
      ["Confirmado", "Confirmado"],
    )
    assert.equal(pair.guests[0].menuSelections[0].dishOptionId, "demo-opt-carne")
    assert.equal(
      pair.guests[1].menuSelections[0].dishOptionId,
      "demo-opt-pescado",
    )
    assert.equal(pair.guests[0].seat?.id, seatId)

    const message = await db
      .prepare(
        "SELECT guestId FROM guest_messages WHERE weddingId = 'demo-wedding' AND message = ? ORDER BY createdAt DESC LIMIT 1",
      )
      .bind("Respondemos los dos")
      .first<{ guestId: string }>()

    assert.equal(message?.guestId, secondGuest.id)
    assert.equal(pair.messages.length, 1)
    assert.equal(pair.messages[0].message, "Respondemos los dos")

    for (const [firstAttends, secondAttends] of [
      [true, false],
      [false, true],
      [false, false],
    ]) {
      pair = (await repository.respondToPartyWithDetails(pair.inviteToken, {
        guests: [
          {
            guestId: firstGuest.id,
            attending: firstAttends,
            notes: firstAttends ? "Sin gluten" : "Se debe limpiar",
            menuSelections: firstAttends
              ? [
                  {
                    menuDishId: "demo-menu-dish-principal",
                    dishOptionId: "demo-opt-carne",
                  },
                ]
              : [],
          },
          {
            guestId: secondGuest.id,
            attending: secondAttends,
            notes: secondAttends ? "Sin lactosa" : "Se debe limpiar",
            menuSelections: secondAttends
              ? [
                  {
                    menuDishId: "demo-menu-dish-principal",
                    dishOptionId: "demo-opt-pescado",
                  },
                ]
              : [],
          },
        ],
      }))!

      assert.equal(pair.guests[0].rsvp, firstAttends ? "Confirmado" : "Declinado")
      assert.equal(pair.guests[1].rsvp, secondAttends ? "Confirmado" : "Declinado")
      assert.equal(pair.guests[0].menuSelections.length, firstAttends ? 1 : 0)
      assert.equal(pair.guests[1].menuSelections.length, secondAttends ? 1 : 0)
      assert.equal(pair.guests[0].notes, firstAttends ? "Sin gluten" : "")
      assert.equal(pair.guests[1].notes, secondAttends ? "Sin lactosa" : "")
      assert.equal(pair.guests[0].seat?.id, seatId)
    }

    await repository.markPartiesInvited("demo-wedding", [pair.id])

    const switchedRecipient = await repository.updateInvitationParty(pair.id, {
      weddingId: "demo-wedding",
      groupName: "Pareja corregida",
      guests: pair.guests.map((guest, index) => ({
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: index === 0 ? "primera@example.com" : guest.email,
        phone: guest.phone,
        isRecipient: index === 0,
      })),
    })

    assert.equal(switchedRecipient?.guests[0].role, "primary")
    assert.equal(switchedRecipient?.guests[1].role, "companion")

    await assert.rejects(() =>
      repository.updateInvitationParty(pair.id, {
        weddingId: "demo-wedding",
        groupName: "Pareja",
        guests: [
          {
            id: pair.guests[0].id,
            firstName: pair.guests[0].firstName,
            lastName: pair.guests[0].lastName,
            email: "primera@example.com",
            isRecipient: true,
          },
        ],
      }),
    )
  } finally {
    await db.prepare("DELETE FROM wedding_seats WHERE id = ?").bind(seatId).run()

    for (const partyId of partyIds) {
      await db
        .prepare("DELETE FROM guest_parties WHERE id = ?")
        .bind(partyId)
        .run()
    }

    await prisma.$disconnect()
    await platform.dispose()
  }
})
