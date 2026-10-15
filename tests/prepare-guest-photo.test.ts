import assert from "node:assert/strict"
import test from "node:test"

import { GUEST_PHOTO_MAX_BYTES } from "../src/domains/guest-photos/domain/guest-photo-rules"
import {
  GuestPhotoPreparationError,
  prepareGuestPhoto,
} from "../src/domains/wedding-sites/adapters/next/components/guest-photos/prepare-guest-photo"

const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0])
const jpeg = () => new Blob([jpegBytes], { type: "image/jpeg" })
const mustNotConvert = async (): Promise<Blob> => { throw new Error("No debe convertir esta foto") }

function heic(name = "IMG_1234.HEIC", type = "image/heic") {
  return new File(["\0\0\0\x18ftypheic\0\0\0\0mif1heic"], name, { type, lastModified: 1234 })
}

test("un JPEG normal se conserva sin cargar el conversor", async () => {
  const file = new File([jpegBytes], "foto.jpg", { type: "image/jpeg" })
  assert.equal(await prepareGuestPhoto(file, mustNotConvert), file)
})

test("un JPEG que iOS entrega con nombre HEIC no se vuelve a convertir", async () => {
  const file = new File([jpegBytes], "IMG_1234.HEIC", { type: "image/jpeg" })
  assert.equal(await prepareGuestPhoto(file, mustNotConvert), file)
  const missingMime = new File([jpegBytes], "IMG_1234.HEIC")
  const prepared = await prepareGuestPhoto(missingMime, mustNotConvert)
  assert.equal(prepared.type, "image/jpeg")
  assert.deepEqual(await prepared.arrayBuffer(), await file.arrayBuffer())
})

test("detecta HEIC por contenido aunque el selector omita o equivoque el MIME", async () => {
  for (const type of ["image/heic", "", "image/jpeg"]) {
    const file = heic("IMG_1234.HEIC", type)
    let calls = 0
    const prepared = await prepareGuestPhoto(file, async (original) => {
      calls += 1
      assert.equal(original, file)
      return jpeg()
    })
    assert.equal(calls, 1)
    assert.equal(prepared.name, "IMG_1234.jpg")
    assert.equal(prepared.type, "image/jpeg")
    assert.equal(prepared.lastModified, file.lastModified)
    assert.deepEqual(new Uint8Array(await prepared.arrayBuffer()), jpegBytes)
  }
})

test("admite HEIF y HEIC sequence cuando el selector los identifica por MIME o extensión", async () => {
  for (const [name, type] of [["foto.HEIF", ""], ["foto", "image/heic-sequence"]]) {
    const prepared = await prepareGuestPhoto(new File(["heif"], name, { type }), async () => jpeg())
    assert.equal(prepared.type, "image/jpeg")
  }
})

test("AVIF con marca compatible mif1 sigue siendo AVIF", async () => {
  const file = new File(["\0\0\0\x18ftypmif1\0\0\0\0avifmif1"], "foto.avif", { type: "image/avif" })
  assert.equal(await prepareGuestPhoto(file, mustNotConvert), file)
})

test("el tamaño se comprueba antes de convertir y también en el JPEG resultante", async () => {
  const oversized = new Blob([new Uint8Array(GUEST_PHOTO_MAX_BYTES + 1)], { type: "image/jpeg" })
  for (const file of [new File([], "vacio.heic"), new File([oversized], "grande.heic")]) {
    await assert.rejects(prepareGuestPhoto(file, mustNotConvert), { reason: "too_large" })
  }
  await assert.rejects(prepareGuestPhoto(heic(), async () => oversized), { reason: "too_large" })
})

test("los errores de conversión conservan la causa y permiten explicar cómo recuperar la foto", async () => {
  const cause = new Error("HEIC dañado")
  await assert.rejects(prepareGuestPhoto(heic(), async () => { throw cause }), (error: unknown) => {
    assert.ok(error instanceof GuestPhotoPreparationError)
    assert.equal(error.reason, "conversion_failed")
    assert.equal(error.cause, cause)
    return true
  })
  await assert.rejects(prepareGuestPhoto(heic(), async () => new Blob()), { reason: "conversion_failed" })
  await assert.rejects(prepareGuestPhoto(new File(["texto"], "foto.txt"), mustNotConvert), { reason: "unsupported_type" })
})
