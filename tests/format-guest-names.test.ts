import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  getInvitationListLabel,
  joinSpanishNames,
} from "@/domains/guests/application/format-guest-names"

describe("joinSpanishNames", () => {
  it("usa una sola y antes del último nombre", () => {
    assert.equal(
      joinSpanishNames(["Eva López", "Mario Ruiz", "Nuria Díaz", "Pablo Sanz", "Sara Vega"]),
      "Eva López, Mario Ruiz, Nuria Díaz, Pablo Sanz y Sara Vega",
    )
  })

  it("mantiene las formas de uno y dos nombres", () => {
    assert.equal(joinSpanishNames(["Ana"]), "Ana")
    assert.equal(joinSpanishNames(["Ana", "Luis"]), "Ana y Luis")
  })

  it("ignora entradas vacías", () => {
    assert.equal(joinSpanishNames([" Ana ", "", "Luis"]), "Ana y Luis")
  })

  it("usa el nombre conjunto en la lista cuando existe", () => {
    assert.equal(
      getInvitationListLabel({
        invitationName: "David y María",
        inviteeNames: "David Merino y María López",
        guests: [
          { firstName: "David", name: "David Merino" },
          { firstName: "María", name: "María López" },
        ],
      }),
      "David y María",
    )
  })

  it("usa solo los nombres de pila si la invitación conjunta no tiene nombre", () => {
    assert.equal(
      getInvitationListLabel({
        invitationName: "",
        inviteeNames: "Dani Cruces y Antonio Pérez",
        guests: [
          { firstName: "Dani", name: "Dani Cruces" },
          { firstName: "Antonio", name: "Antonio Pérez" },
        ],
      }),
      "Dani y Antonio",
    )
  })

  it("mantiene el nombre completo en invitaciones individuales", () => {
    assert.equal(
      getInvitationListLabel({
        invitationName: "",
        inviteeNames: "Nuria Chamorro",
        guests: [{ firstName: "Nuria", name: "Nuria Chamorro" }],
      }),
      "Nuria Chamorro",
    )
  })
})
