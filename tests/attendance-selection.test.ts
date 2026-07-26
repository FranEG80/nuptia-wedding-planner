import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { applyAttendanceChoice } from "@/domains/invitations/application/attendance-selection"

const guests = [
  { id: "eva", attending: null },
  { id: "mario", attending: null },
  { id: "nuria", attending: null },
]

describe("applyAttendanceChoice", () => {
  it("permite marcar una combinación de personas en grupos grandes", () => {
    const afterEva = applyAttendanceChoice(guests, "toggle:eva")
    const afterMario = applyAttendanceChoice(afterEva, "toggle:mario")

    assert.deepEqual(
      afterMario.map((guest) => guest.attending),
      [true, true, false],
    )
  })

  it("permite desmarcar a todos", () => {
    assert.deepEqual(
      applyAttendanceChoice(
        guests.map((guest) => ({ ...guest, attending: true })),
        "none",
      ).map((guest) => guest.attending),
      [false, false, false],
    )
  })
})
