import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { getPlatformProxy } from "wrangler"

test("D1 revierte todas las respuestas si falla una sentencia del batch", async () => {
  const platform = await getPlatformProxy<Pick<CloudflareEnv, "DB">>({
    configPath: "wrangler.jsonc",
    persist: true,
    remoteBindings: false,
  })
  const db = platform.env.DB
  const partyId = `test-party-${randomUUID()}`
  const guestId = `test-guest-${randomUUID()}`
  const now = new Date().toISOString()

  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO guest_parties
            (id, weddingId, inviteToken, groupName, inviteStatus, createdAt, updatedAt)
           VALUES (?, 'demo-wedding', ?, 'Prueba batch', 'pending', ?, ?)`,
        )
        .bind(partyId, randomUUID(), now, now),
      db
        .prepare(
          `INSERT INTO guests
            (id, partyId, weddingId, role, name, rsvpStatus, notes, createdAt, updatedAt)
           VALUES (?, ?, 'demo-wedding', 'primary', 'Invitado de prueba',
             'no_response', '', ?, ?)`,
        )
        .bind(guestId, partyId, now, now),
    ])

    await assert.rejects(() =>
      db.batch([
        db
          .prepare(
            "UPDATE guests SET rsvpStatus = 'confirmed', updatedAt = ? WHERE id = ?",
          )
          .bind(new Date().toISOString(), guestId),
        db
          .prepare(
            `INSERT INTO guest_menu_selections
              (id, guestId, menuDishId, dishOptionId)
             VALUES (?, ?, 'missing-menu-dish', 'missing-option')`,
          )
          .bind(randomUUID(), guestId),
      ]),
    )

    const guest = await db
      .prepare("SELECT rsvpStatus FROM guests WHERE id = ?")
      .bind(guestId)
      .first<{ rsvpStatus: string }>()

    assert.equal(guest?.rsvpStatus, "no_response")
  } finally {
    await db
      .prepare("DELETE FROM guest_parties WHERE id = ?")
      .bind(partyId)
      .run()
    await platform.dispose()
  }
})
