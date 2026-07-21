import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { parseGuestImportRows } from "@/domains/guests/application/guest-import"

describe("parseGuestImportRows", () => {
  it("imports a solo guest as recipient by default", () => {
    const result = parseGuestImportRows([
      { Grupo: "", Nombre: "Ana", Apellidos: "Ruiz", Teléfono: "600111222", Email: "" },
    ])

    assert.equal(result.parties.length, 1)
    assert.equal(result.parties[0].guests.length, 1)
    assert.equal(result.parties[0].guests[0].isRecipient, true)
    assert.equal(result.rows[0].status, "ok")
  })

  it("groups two rows sharing the same Grupo into one invitation", () => {
    const result = parseGuestImportRows([
      { Grupo: "Familia Ruiz", Nombre: "Ana", Teléfono: "600111222", Destinatario: "Sí" },
      { Grupo: "Familia Ruiz", Nombre: "Luis", Teléfono: "600333444", Destinatario: "No" },
    ])

    assert.equal(result.parties.length, 1)
    const [party] = result.parties
    assert.equal(party.guests.length, 2)
    assert.equal(party.guests.find((g) => g.firstName === "Ana")?.isRecipient, true)
    assert.equal(party.guests.find((g) => g.firstName === "Luis")?.isRecipient, false)
  })

  it("auto-picks the recipient with contact info when none is marked", () => {
    const result = parseGuestImportRows([
      { Grupo: "Pareja", Nombre: "Ana", Teléfono: "", Email: "" },
      { Grupo: "Pareja", Nombre: "Luis", Teléfono: "600333444", Email: "" },
    ])

    const [party] = result.parties
    assert.equal(party.guests.find((g) => g.firstName === "Luis")?.isRecipient, true)
    assert.equal(party.guests.find((g) => g.firstName === "Ana")?.isRecipient, false)
  })

  it("rejects a third person sharing the same Grupo", () => {
    const result = parseGuestImportRows([
      { Grupo: "Trio", Nombre: "Ana", Teléfono: "600111222" },
      { Grupo: "Trio", Nombre: "Luis", Teléfono: "600333444" },
      { Grupo: "Trio", Nombre: "Eva", Teléfono: "600555666" },
    ])

    assert.equal(result.parties.length, 1)
    assert.equal(result.parties[0].guests.length, 2)
    const errorRow = result.rows.find((row) => row.rowNumber === 4)
    assert.equal(errorRow?.status, "error")
  })

  it("flags a row missing the first name", () => {
    const result = parseGuestImportRows([
      { Grupo: "", Nombre: "", Teléfono: "600111222" },
    ])

    assert.equal(result.parties.length, 0)
    assert.equal(result.rows[0].status, "error")
    assert.match(result.rows[0].message, /nombre/i)
  })

  it("rejects a recipient without phone or email", () => {
    const result = parseGuestImportRows([
      { Grupo: "", Nombre: "Ana", Teléfono: "", Email: "" },
    ])

    assert.equal(result.parties.length, 0)
    assert.equal(result.rows[0].status, "error")
  })

  it("rejects an invalid email", () => {
    const result = parseGuestImportRows([
      { Grupo: "", Nombre: "Ana", Teléfono: "600111222", Email: "no-es-un-email" },
    ])

    assert.equal(result.parties.length, 0)
    assert.equal(result.rows[0].status, "error")
  })

  it("warns about emails that already exist without blocking the import", () => {
    const result = parseGuestImportRows(
      [{ Grupo: "", Nombre: "Ana", Email: "ana@example.com" }],
      { existingEmails: new Set(["ana@example.com"]) },
    )

    assert.equal(result.parties.length, 1)
    assert.equal(result.rows[0].status, "warning")
  })

  it("skips fully blank rows", () => {
    const result = parseGuestImportRows([
      { Grupo: "", Nombre: "", Teléfono: "", Email: "", Apellidos: "" },
    ])

    assert.equal(result.parties.length, 0)
    assert.equal(result.rows.length, 0)
  })
})
