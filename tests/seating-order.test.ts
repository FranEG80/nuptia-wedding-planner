import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { seatedGuestsAtTable } from "@/domains/guests/domain/seating"

function guest(id: string, seat: { tableId: string; position: number } | null) {
  return { id, seat }
}

describe("orden de invitados en mesa", () => {
  it("devuelve los sentados en la mesa en el orden en que se sentaron", () => {
    const guests = [
      guest("ana", { tableId: "mesa-1", position: 3 }),
      guest("luis", { tableId: "mesa-1", position: 1 }),
      guest("marta", { tableId: "mesa-2", position: 1 }),
      guest("pablo", { tableId: "mesa-1", position: 2 }),
      guest("sin-mesa", null),
    ]

    assert.deepEqual(
      seatedGuestsAtTable(guests, "mesa-1").map((item) => item.id),
      ["luis", "pablo", "ana"],
    )
  })

  it("no altera el array original", () => {
    const guests = [
      guest("ana", { tableId: "mesa-1", position: 2 }),
      guest("luis", { tableId: "mesa-1", position: 1 }),
    ]

    seatedGuestsAtTable(guests, "mesa-1")

    assert.deepEqual(
      guests.map((item) => item.id),
      ["ana", "luis"],
    )
  })

  it("devuelve lista vacía si la mesa no tiene invitados", () => {
    const guests = [guest("ana", { tableId: "mesa-2", position: 1 })]

    assert.deepEqual(seatedGuestsAtTable(guests, "mesa-1"), [])
  })
})
