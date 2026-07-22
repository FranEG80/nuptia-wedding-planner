import assert from "node:assert/strict"
import { test } from "node:test"

import { PrismaD1 } from "@prisma/adapter-d1"
import { getPlatformProxy } from "wrangler"

import type { PrismaClient as AppPrismaClient } from "@generated/prisma/client"
import { PrismaClient } from "@generated/prisma-seed/client"
import { createBindingD1BatchDatabase } from "@/core/db/d1-batch"
import { PrismaGuestRepository } from "@/domains/guests/adapters/prisma/prisma-guest.repository"
import { importInvitationPartiesUseCase } from "@/domains/guests/application/use-cases/import-invitation-parties.use-case"

test("la importación D1 es idempotente y fusiona el acompañante nuevo", async () => {
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

  try {
    const existing = await repository.createInvitationParty({
      weddingId: "demo-wedding",
      groupName: "Importación e2e",
      guests: [
        {
          firstName: "Ana",
          lastName: "Existente",
          email: "import-idempotent-ana@example.com",
          phone: "+34 611 200 001",
          isRecipient: true,
        },
      ],
    })
    partyIds.push(existing.id)

    const result = await importInvitationPartiesUseCase({
      guestRepository: repository,
      weddingId: "demo-wedding",
      parties: [
        {
          groupName: "Importación e2e",
          guests: [
            {
              firstName: "Nora",
              lastName: "Nueva",
              email: "import-idempotent-nora@example.com",
              phone: "+34 611 200 002",
              isRecipient: true,
            },
          ],
        },
        {
          groupName: "Importación e2e",
          guests: [
            {
              firstName: "Oscar",
              email: " IMPORT-IDEMPOTENT-ANA@EXAMPLE.COM ",
              phone: null,
              isRecipient: true,
            },
          ],
        },
        {
          groupName: "Importación e2e",
          guests: [
            {
              firstName: "Ana",
              lastName: "Existente",
              email: "import-idempotent-ana@example.com",
              phone: "+34 611 200 001",
              isRecipient: true,
            },
            {
              firstName: "Rafa",
              lastName: "Acompañante",
              email: "import-idempotent-rafa@example.com",
              phone: "+34 611 200 003",
              isRecipient: false,
            },
          ],
        },
      ],
    })

    assert.equal(result.created, 1)
    assert.equal(result.merged, 1)
    assert.equal(result.skipped, 1)
    assert.equal(result.parties.length, 2)

    const parties = await repository.listPartiesByWeddingId("demo-wedding")
    const merged = parties.find((party) => party.id === existing.id)
    const nora = result.parties.find((party) => party.recipient.firstName === "Nora")

    assert.deepEqual(
      merged?.guests.map((guest) => guest.firstName),
      ["Ana", "Rafa"],
    )
    assert.ok(nora)
    assert.equal(
      parties.filter((party) =>
        party.guests.some(
          (guest) => guest.email === "import-idempotent-ana@example.com",
        ),
      ).length,
      1,
    )
  } finally {
    for (const partyId of partyIds) {
      await repository.deleteInvitationParty(partyId, "demo-wedding")
    }

    const imported = await db
      .prepare(
        "SELECT id FROM guest_parties WHERE groupName = 'Importación e2e'",
      )
      .all<{ id: string }>()

    for (const row of imported.results ?? []) {
      await repository.deleteInvitationParty(row.id, "demo-wedding")
    }

    await prisma.$disconnect()
    await platform.dispose()
  }
})
