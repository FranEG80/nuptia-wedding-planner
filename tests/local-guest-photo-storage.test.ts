import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  LocalGuestPhotoStorage,
  handleLocalGuestPhotoUpload,
} from "@/domains/guest-photos/adapters/r2/local-guest-photo-storage"
import { GUEST_PHOTO_MAX_BYTES } from "@/domains/guest-photos/domain/guest-photo-rules"
import type { PutMediaObjectInput } from "@/domains/media/domain/ports/media-object-storage"

const secret = "local-test-secret-with-at-least-32-characters"
const key = "weddings/test/guest-photos/6f1c2b8e-4a5d-4c3b-9e2f-1a2b3c4d5e6f/original.jpg"
const contentType = "image/jpeg"

async function setup(expiresInSeconds = 900) {
  const storage = new LocalGuestPhotoStorage({} as R2Bucket, secret)
  const url = new URL(await storage.createSignedUploadUrl({ key, contentType, expiresInSeconds }), "http://localhost:3000")
  const written: PutMediaObjectInput[] = []
  const target = { async put(input: PutMediaObjectInput) { written.push(input) } }
  return { url, written, target }
}

function request(url: URL, body: Uint8Array<ArrayBuffer> = new Uint8Array([1, 2, 3]), headers = {}) {
  return new Request(url, { method: "PUT", body, headers: { "Content-Type": contentType, ...headers } })
}

describe("subida firmada a R2 local", () => {
  it("escribe únicamente el original autorizado con su tipo y bytes", async () => {
    const { url, target, written } = await setup()
    const response = await handleLocalGuestPhotoUpload(request(url), target, secret)
    assert.equal(url.pathname, "/api/media/local-upload")
    assert.equal(response.status, 204)
    assert.deepEqual(written, [{ key, contentType, body: new Uint8Array([1, 2, 3]) }])
  })

  it("rechaza tokens ausentes, manipulados, caducados o firmados con otra clave", async () => {
    const { url, target, written } = await setup()
    const missing = new URL(url)
    missing.search = ""
    const tampered = new URL(url)
    const parts = tampered.searchParams.get("token")!.split(".")
    parts[1] = Buffer.from(JSON.stringify({ key: "weddings/otra/foto.jpg" })).toString("base64url")
    tampered.searchParams.set("token", parts.join("."))
    const expired = await setup(-1)
    for (const attempt of [missing, tampered, expired.url]) {
      assert.equal((await handleLocalGuestPhotoUpload(request(attempt), target, secret)).status, 403)
    }
    assert.equal((await handleLocalGuestPhotoUpload(request(url), target, "otra-clave")).status, 403)
    assert.equal(written.length, 0)
  })

  it("rechaza otro origen, otro tipo y originales vacíos o por encima del límite real", async () => {
    const { url, target, written } = await setup()
    assert.equal((await handleLocalGuestPhotoUpload(request(url, undefined, { Origin: "https://otra.test" }), target, secret)).status, 403)
    assert.equal((await handleLocalGuestPhotoUpload(request(url, undefined, { "Content-Type": "image/png" }), target, secret)).status, 415)
    assert.equal((await handleLocalGuestPhotoUpload(request(url, new Uint8Array()), target, secret)).status, 400)
    assert.equal((await handleLocalGuestPhotoUpload(request(url, new Uint8Array(GUEST_PHOTO_MAX_BYTES + 1), { "Content-Length": "1" }), target, secret)).status, 413)
    assert.equal(written.length, 0)
  })
})
