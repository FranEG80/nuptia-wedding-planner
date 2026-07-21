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

  it("groups two rows sharing the same 'Invitación conjunta' into one invitation", () => {
    const result = parseGuestImportRows([
      { "Invitación conjunta": "F1", Nombre: "Ana", Teléfono: "600111222", Destinatario: "Sí" },
      { "Invitación conjunta": "F1", Nombre: "Luis", Teléfono: "600333444", Destinatario: "No" },
    ])

    assert.equal(result.parties.length, 1)
    const [party] = result.parties
    assert.equal(party.guests.length, 2)
    assert.equal(party.guests.find((g) => g.firstName === "Ana")?.isRecipient, true)
    assert.equal(party.guests.find((g) => g.firstName === "Luis")?.isRecipient, false)
  })

  it("does not pair rows just because they share the same Grupo label", () => {
    const result = parseGuestImportRows([
      { Grupo: "Trabajo", Nombre: "Ana", Teléfono: "600111222" },
      { Grupo: "Trabajo", Nombre: "Luis", Teléfono: "600333444" },
      { Grupo: "Trabajo", Nombre: "Eva", Teléfono: "600555666" },
    ])

    assert.equal(result.parties.length, 3)
    assert.ok(result.parties.every((party) => party.guests.length === 1))
    assert.ok(result.rows.every((row) => row.status === "ok"))
  })

  it("supports a Grupo with several couples and singles, each with their own invitation", () => {
    const result = parseGuestImportRows([
      { Grupo: "Familia Novio", "Invitación conjunta": "F1", Nombre: "Ana", Teléfono: "600111222", Destinatario: "Sí" },
      { Grupo: "Familia Novio", "Invitación conjunta": "F1", Nombre: "Luis", Destinatario: "No" },
      { Grupo: "Familia Novio", "Invitación conjunta": "F2", Nombre: "Eva", Teléfono: "600555666", Destinatario: "Sí" },
      { Grupo: "Familia Novio", "Invitación conjunta": "F2", Nombre: "Mario", Destinatario: "No" },
      { Grupo: "Familia Novio", Nombre: "Pedro", Teléfono: "600777888" },
    ])

    assert.equal(result.parties.length, 3)
    assert.ok(result.parties.every((party) => party.groupName === "Familia Novio"))
    const soloParty = result.parties.find((party) => party.guests.length === 1)
    assert.equal(soloParty?.guests[0].firstName, "Pedro")
    assert.equal(soloParty?.guests[0].isRecipient, true)
    assert.ok(result.rows.every((row) => row.status === "ok"))
  })

  it("auto-picks the recipient with contact info when none is marked", () => {
    const result = parseGuestImportRows([
      { "Invitación conjunta": "Pareja", Nombre: "Ana", Teléfono: "", Email: "" },
      { "Invitación conjunta": "Pareja", Nombre: "Luis", Teléfono: "600333444", Email: "" },
    ])

    const [party] = result.parties
    assert.equal(party.guests.find((g) => g.firstName === "Luis")?.isRecipient, true)
    assert.equal(party.guests.find((g) => g.firstName === "Ana")?.isRecipient, false)
  })

  it("rejects a third person sharing the same 'Invitación conjunta'", () => {
    const result = parseGuestImportRows([
      { "Invitación conjunta": "Trio", Nombre: "Ana", Teléfono: "600111222" },
      { "Invitación conjunta": "Trio", Nombre: "Luis", Teléfono: "600333444" },
      { "Invitación conjunta": "Trio", Nombre: "Eva", Teléfono: "600555666" },
    ])

    assert.equal(result.parties.length, 1)
    assert.equal(result.parties[0].guests.length, 2)
    const errorRow = result.rows.find((row) => row.rowNumber === 4)
    assert.equal(errorRow?.status, "error")
  })

  it("warns when the two people of a joint invitation disagree on Grupo", () => {
    const result = parseGuestImportRows([
      { Grupo: "Familia", "Invitación conjunta": "F1", Nombre: "Ana", Teléfono: "600111222" },
      { Grupo: "Amigos", "Invitación conjunta": "F1", Nombre: "Luis", Teléfono: "600333444" },
    ])

    assert.equal(result.parties.length, 1)
    assert.ok(result.rows.every((row) => row.status === "warning"))
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
