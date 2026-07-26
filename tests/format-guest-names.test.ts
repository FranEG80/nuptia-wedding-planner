import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { joinSpanishNames } from "@/domains/guests/application/format-guest-names"

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
})
