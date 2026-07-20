import assert from "node:assert/strict"
import { describe, it, mock } from "node:test"

import {
  apiErrorResponse,
  secureApiErrorResponse,
  withApiErrorHandling,
} from "@/shared/http/api-errors"
import { GET as unknownApiRoute } from "@/app/api/[...path]/route"

describe("contrato de errores HTTP", () => {
  it("devuelve JSON seguro, no cacheable y con un ID correlacionable", async () => {
    const response = apiErrorResponse({
      code: "RESOURCE_NOT_FOUND",
      message: "Recurso no encontrado",
      requestId: "request-123",
      status: 404,
    })

    assert.equal(response.status, 404)
    assert.equal(response.headers.get("cache-control"), "no-store")
    assert.equal(response.headers.get("x-content-type-options"), "nosniff")
    assert.equal(response.headers.get("x-request-id"), "request-123")
    assert.deepEqual(await response.json(), {
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Recurso no encontrado",
        requestId: "request-123",
      },
    })
  })

  it("no filtra el mensaje ni la traza de una excepción interna", async () => {
    const consoleError = mock.method(console, "error", () => undefined)

    try {
      const response = await withApiErrorHandling(
        { operation: "test.secret-operation" },
        () => {
          throw new Error("DATABASE_URL=super-secret")
        },
      )
      const responseText = await response.text()

      assert.equal(response.status, 500)
      assert.equal(response.headers.get("cache-control"), "no-store")
      assert.equal(responseText.includes("DATABASE_URL"), false)
      assert.equal(responseText.includes("super-secret"), false)
      assert.match(responseText, /"code":"INTERNAL_SERVER_ERROR"/)
      assert.equal(consoleError.mock.callCount(), 1)
    } finally {
      consoleError.mock.restore()
    }
  })

  it("responde con JSON ante una ruta API inexistente", async () => {
    const response = unknownApiRoute()
    const body = await response.json()

    assert.equal(response.status, 404)
    assert.equal(response.headers.get("content-type"), "application/json")
    assert.equal(body.error.code, "API_ROUTE_NOT_FOUND")
    assert.equal(body.error.message, "Endpoint no encontrado")
  })

  it("refuerza un error JSON de proveedor sin cambiar su contrato", async () => {
    const providerResponse = Response.json(
      {
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      },
      { status: 401 },
    )
    const response = secureApiErrorResponse(providerResponse, "request-456")

    assert.equal(response.status, 401)
    assert.equal(response.headers.get("cache-control"), "no-store")
    assert.equal(response.headers.get("x-content-type-options"), "nosniff")
    assert.equal(response.headers.get("x-request-id"), "request-456")
    assert.deepEqual(await response.json(), {
      code: "INVALID_CREDENTIALS",
      message: "Invalid credentials",
    })
  })
})
