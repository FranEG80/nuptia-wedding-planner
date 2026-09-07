import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { DEFAULT_INVITATION_CONTENT } from "@/domains/invitations/domain/invitation-design"
import {
  isRegistryHiddenForGuests,
  parseRegistryHiddenPhones,
  withRegistryHidden,
} from "@/domains/invitations/domain/invitation-registry-visibility"

describe("parseRegistryHiddenPhones", () => {
  it("normaliza la lista a los últimos nueve dígitos", () => {
    assert.deepEqual(
      parseRegistryHiddenPhones("638096812, +34 676 96 65 01;695191723"),
      ["638096812", "676966501", "695191723"],
    )
  })

  it("devuelve una lista vacía cuando no hay valor útil", () => {
    assert.deepEqual(parseRegistryHiddenPhones(undefined), [])
    assert.deepEqual(parseRegistryHiddenPhones(""), [])
    assert.deepEqual(parseRegistryHiddenPhones("12345, ,abc"), [])
  })
})

describe("isRegistryHiddenForGuests", () => {
  const hidden = parseRegistryHiddenPhones("638096812,676966501,695191723")

  it("oculta la sección si algún invitado coincide, sin importar el prefijo", () => {
    assert.equal(isRegistryHiddenForGuests(["+34 638 09 68 12"], hidden), true)
    assert.equal(isRegistryHiddenForGuests([null, "0034695191723"], hidden), true)
  })

  it("mantiene la sección para el resto de invitaciones", () => {
    assert.equal(isRegistryHiddenForGuests(["+34625391654"], hidden), false)
    assert.equal(isRegistryHiddenForGuests([null, undefined, ""], hidden), false)
  })

  it("no oculta nada cuando la variable de entorno está vacía", () => {
    assert.equal(isRegistryHiddenForGuests(["638096812"], []), false)
  })
})

describe("withRegistryHidden", () => {
  it("solo apaga la sección de regalos", () => {
    const content = withRegistryHidden(DEFAULT_INVITATION_CONTENT)

    assert.equal(content.visibleSections.registry, false)
    assert.equal(content.visibleSections.rsvp, DEFAULT_INVITATION_CONTENT.visibleSections.rsvp)
    assert.equal(DEFAULT_INVITATION_CONTENT.visibleSections.registry, true)
  })
})
