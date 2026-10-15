import assert from "node:assert/strict"
import { describe, it, mock } from "node:test"

import { createGuestAccessPostHandler } from "@/domains/wedding-sites/adapters/next/guest-access-route"
import { GuestAccessRequestError, verifyGuestPhoneRequest } from "@/domains/wedding-sites/adapters/next/components/guest-access-request"
import type { ApiErrorBody } from "@/shared/http/api-errors"

const context = { params: Promise.resolve({ slug: "boda" }) }
const makeRequest = (body: unknown) => new Request("https://nuptia.test/api/w/boda/guest-access", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
})

describe("identificación pública con JSON y referencia de error", () => {
  it("identifica al fotógrafo y correlaciona la respuesta con su cabecera", async () => {
    const handler = createGuestAccessPostHandler(async input => {
      assert.deepEqual(input, { slug: "boda", phone: "600112233" })
      return { status: "photographer" }
    })
    const response = await handler(makeRequest({ phone: "600112233" }), context)
    const body = await response.json() as { status: string; requestId: string }
    assert.equal(response.status, 200)
    assert.equal(body.status, "photographer")
    assert.equal(body.requestId, response.headers.get("x-request-id"))
    assert.equal(response.headers.get("cache-control"), "no-store")
  })

  it("los errores al cargar módulos tienen JSON y traza correlacionada en logs", async () => {
    const log = mock.method(console, "error", () => undefined)
    try {
      const handler = createGuestAccessPostHandler(async () => {
        throw new Error("Failed to load external module sharp", { cause: new Error("libvips missing") })
      })
      const response = await handler(makeRequest({ phone: "600112233" }), context)
      const body = await response.json() as ApiErrorBody
      assert.equal(response.status, 500)
      assert.match(response.headers.get("content-type")!, /application\/json/)
      assert.equal(body.error.code, "GUEST_ACCESS_VERIFICATION_FAILED")
      assert.equal(body.error.requestId, response.headers.get("x-request-id"))
      const entry = JSON.parse(String(log.mock.calls[0].arguments[0]))
      assert.equal(entry.requestId, body.error.requestId)
      assert.equal(entry.operation, "guest-access.verify-phone")
      assert.match(entry.error.stack, /Failed to load external module sharp/)
      assert.equal(entry.error.cause.message, "libvips missing")
      assert.equal(JSON.stringify(body).includes("libvips"), false)
      assert.equal(JSON.stringify(entry).includes("600112233"), false)
    } finally { log.mock.restore() }
  })

  it("rechaza JSON inválido y teléfonos con tipo incorrecto sin consultar datos", async () => {
    const handler = createGuestAccessPostHandler(async () => assert.fail("no debe consultar datos"))
    const invalid = new Request("https://nuptia.test", { method: "POST", body: "{" })
    assert.equal((await handler(invalid, context)).status, 400)
    assert.equal((await handler(makeRequest({ phone: 123 }), context)).status, 400)
  })

  it("el cliente conserva la referencia del error HTTP para poder comunicarla", async () => {
    const fetch = mock.method(globalThis, "fetch", async () => Response.json({
      error: { code: "GUEST_ACCESS_VERIFICATION_FAILED", requestId: "request-test" },
    }, { status: 500 }))
    try {
      await assert.rejects(verifyGuestPhoneRequest({ slug: "boda", phone: "600112233" }), error => {
        assert.ok(error instanceof GuestAccessRequestError)
        assert.equal(error.requestId, "request-test")
        return true
      })
    } finally { fetch.mock.restore() }
  })

  it("el cliente entiende una respuesta JSON de fotógrafo y un teléfono no encontrado", async () => {
    const fetch = mock.method(globalThis, "fetch", async () => Response.json({ status: "photographer" }))
    try {
      assert.deepEqual(await verifyGuestPhoneRequest({ slug: "boda", phone: "600112233" }), { status: "photographer" })
      fetch.mock.mockImplementation(async () => Response.json({ status: "not_found" }, { status: 404 }))
      assert.deepEqual(await verifyGuestPhoneRequest({ slug: "boda", phone: "600112233" }), { status: "not_found" })
    } finally { fetch.mock.restore() }
  })
})
