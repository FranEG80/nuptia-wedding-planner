import assert from "node:assert/strict"
import test from "node:test"

import { publicInvitationResponseSchema } from "@/domains/invitations/application/dtos/public-invitation-response.dto"

function buildGuest(overrides: {
  guestId: string
  attending: boolean
  firstName: string
  lastName?: string
  phone?: string
  notes?: string
  menuSelections?: Array<{ menuDishId: string; dishOptionId: string }>
}) {
  return {
    guestId: overrides.guestId,
    attending: overrides.attending,
    firstName: overrides.firstName,
    lastName: overrides.lastName ?? "",
    email: null,
    phone: overrides.phone ?? "",
    notes: overrides.notes ?? "",
    menuSelections: overrides.menuSelections ?? [],
  }
}

test("acepta la respuesta pública con contactos y mensaje nulos", () => {
  const parsed = publicInvitationResponseSchema.parse({
    token: "invitation-token",
    guests: [
      {
        guestId: "guest-id",
        attending: true,
        firstName: "Ana",
        lastName: "Ruiz Burgos",
        email: null,
        phone: "622943008",
        notes: "",
        menuSelections: [],
      },
    ],
    message: null,
  })

  assert.equal(parsed.guests[0].email, null)
  assert.equal(parsed.guests[0].firstName, "Ana")
  assert.equal(parsed.guests[0].lastName, "Ruiz Burgos")
  assert.equal(parsed.guests[0].phone, "622943008")
  assert.equal(parsed.message, null)
})

test("1 invitado que no viene: acepta apellidos y teléfono vacíos", () => {
  const parsed = publicInvitationResponseSchema.parse({
    token: "invitation-token",
    guests: [
      buildGuest({ guestId: "g1", attending: false, firstName: "Sandra" }),
    ],
    message: null,
  })

  assert.equal(parsed.guests[0].attending, false)
  assert.equal(parsed.guests[0].firstName, "Sandra")
  assert.equal(parsed.guests[0].lastName, null)
  assert.equal(parsed.guests[0].phone, null)
})

test("1 invitado que confirma: conserva apellidos, teléfono y menú", () => {
  const parsed = publicInvitationResponseSchema.parse({
    token: "invitation-token",
    guests: [
      buildGuest({
        guestId: "g1",
        attending: true,
        firstName: "Sergio",
        lastName: "Ruiz",
        phone: "625391654",
        notes: "Sin gluten",
        menuSelections: [{ menuDishId: "d1", dishOptionId: "o1" }],
      }),
    ],
    message: "Enhorabuena!",
  })

  assert.equal(parsed.guests[0].attending, true)
  assert.equal(parsed.guests[0].lastName, "Ruiz")
  assert.equal(parsed.guests[0].phone, "625391654")
  assert.equal(parsed.guests[0].menuSelections.length, 1)
  assert.equal(parsed.message, "Enhorabuena!")
})

test("2 invitados: ninguno viene, ambos sin apellidos ni teléfono", () => {
  const parsed = publicInvitationResponseSchema.parse({
    token: "invitation-token",
    guests: [
      buildGuest({ guestId: "g1", attending: false, firstName: "Sergio" }),
      buildGuest({ guestId: "g2", attending: false, firstName: "Sandra" }),
    ],
    message: null,
  })

  assert.deepEqual(
    parsed.guests.map((guest) => guest.attending),
    [false, false],
  )
  assert.deepEqual(
    parsed.guests.map((guest) => guest.lastName),
    [null, null],
  )
})

test("2 invitados: los dos confirman con sus datos completos", () => {
  const parsed = publicInvitationResponseSchema.parse({
    token: "invitation-token",
    guests: [
      buildGuest({
        guestId: "g1",
        attending: true,
        firstName: "Sergio",
        lastName: "Testing",
        phone: "625391654",
        menuSelections: [{ menuDishId: "d1", dishOptionId: "o1" }],
      }),
      buildGuest({
        guestId: "g2",
        attending: true,
        firstName: "Sandra",
        lastName: "Testing",
        phone: "625391655",
        menuSelections: [{ menuDishId: "d1", dishOptionId: "o2" }],
      }),
    ],
    message: null,
  })

  assert.deepEqual(
    parsed.guests.map((guest) => guest.attending),
    [true, true],
  )
  assert.deepEqual(
    parsed.guests.map((guest) => guest.menuSelections.length),
    [1, 1],
  )
})

test("2 invitados: viene solo uno (reproduce el caso de producción)", () => {
  const parsed = publicInvitationResponseSchema.parse({
    token: "invitation-token",
    guests: [
      buildGuest({
        guestId: "6cf72088-3ab2-4ccb-82d2-0970b37ca735",
        attending: true,
        firstName: "Sergio",
        lastName: "Testing Testing",
        phone: "625391654",
      }),
      buildGuest({
        guestId: "b694547a-3add-4350-97c8-3757f5cddc54",
        attending: false,
        firstName: "Sandra",
      }),
    ],
    message: "Quiero los tercios más frios que el corazón de una suegra",
  })

  assert.equal(parsed.guests[0].attending, true)
  assert.equal(parsed.guests[1].attending, false)
  assert.equal(parsed.guests[1].lastName, null)
  assert.equal(parsed.guests[1].phone, null)
})

test("2 invitados + 1 añadido (niño): los tres confirman", () => {
  const parsed = publicInvitationResponseSchema.parse({
    token: "invitation-token",
    guests: [
      buildGuest({
        guestId: "g1",
        attending: true,
        firstName: "Sergio",
        lastName: "Testing",
        phone: "625391654",
        menuSelections: [{ menuDishId: "d1", dishOptionId: "o1" }],
      }),
      buildGuest({
        guestId: "g2",
        attending: true,
        firstName: "Sandra",
        lastName: "Testing",
        phone: "625391655",
        menuSelections: [{ menuDishId: "d1", dishOptionId: "o1" }],
      }),
      buildGuest({
        guestId: "g3-nino",
        attending: true,
        firstName: "Martina",
      }),
    ],
    message: null,
  })

  assert.equal(parsed.guests.length, 3)
  assert.deepEqual(
    parsed.guests.map((guest) => guest.attending),
    [true, true, true],
  )
  assert.equal(parsed.guests[2].lastName, null)
  assert.equal(parsed.guests[2].phone, null)
})
