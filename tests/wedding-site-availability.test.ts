import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  isFullWeddingSiteVisible,
  isWeddingDayReached,
} from "@/domains/wedding-sites/domain/wedding-site-availability"

// Boda de Nacho y Maria Daniela: 16 de octubre de 2026, hora de Madrid.
const WEDDING_ISO = "2026-10-16T16:30:00.000+00:00"

describe("isWeddingDayReached", () => {
  it("está cerrada el día anterior", () => {
    assert.equal(
      isWeddingDayReached(WEDDING_ISO, new Date("2026-10-15T21:59:00Z")),
      false,
    )
  })

  it("se abre a las 00:00 de Madrid, no a las 00:00 UTC", () => {
    // 2026-10-15T22:00Z ya es el 16 de octubre en Madrid (verano, +02:00).
    assert.equal(
      isWeddingDayReached(WEDDING_ISO, new Date("2026-10-15T22:00:00Z")),
      true,
    )
  })

  it("sigue abierta durante todo el día de la boda y después", () => {
    assert.equal(isWeddingDayReached(WEDDING_ISO, new Date("2026-10-16T10:00:00Z")), true)
    assert.equal(isWeddingDayReached(WEDDING_ISO, new Date("2027-01-01T10:00:00Z")), true)
  })

  it("ignora el desfase con el que venga la fecha y usa el día natural", () => {
    // Misma boda expresada con el desfase de la ceremonia.
    assert.equal(
      isWeddingDayReached("2026-10-16T18:30:00+02:00", new Date("2026-10-15T21:59:00Z")),
      false,
    )
    assert.equal(
      isWeddingDayReached("2026-10-16", new Date("2026-10-15T22:00:00Z")),
      true,
    )
  })

  it("no bloquea la web si la fecha es ilegible", () => {
    assert.equal(isWeddingDayReached("", new Date("2020-01-01T00:00:00Z")), true)
    assert.equal(isWeddingDayReached("proximamente", new Date("2020-01-01T00:00:00Z")), true)
  })
})

describe("isFullWeddingSiteVisible", () => {
  const before = new Date("2026-10-01T10:00:00Z")

  it("antes de la boda solo publica la portada", () => {
    assert.equal(
      isFullWeddingSiteVisible({ dateIso: WEDDING_ISO, now: before }),
      false,
    )
  })

  it("WEDDING_SITE_ENABLED abre la web completa en local", () => {
    assert.equal(
      isFullWeddingSiteVisible({ dateIso: WEDDING_ISO, alwaysEnabled: true, now: before }),
      true,
    )
  })

  it("la vista previa del editor nunca se bloquea", () => {
    assert.equal(
      isFullWeddingSiteVisible({ dateIso: WEDDING_ISO, preview: true, now: before }),
      true,
    )
  })

  it("el día de la boda se abre sin necesidad de la variable", () => {
    assert.equal(
      isFullWeddingSiteVisible({ dateIso: WEDDING_ISO, now: new Date("2026-10-16T09:00:00Z") }),
      true,
    )
  })
})
