import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getAttendanceGroupLabel } from "@/domains/invitations/application/attendance-label"

describe("getAttendanceGroupLabel", () => {
  it("adapta la opción conjunta al número de invitados", () => {
    assert.equal(getAttendanceGroupLabel(1), "Asistiré")
    assert.equal(getAttendanceGroupLabel(2), "Asistiremos los dos")
    assert.equal(getAttendanceGroupLabel(5), "Asistiremos todos")
  })
})
