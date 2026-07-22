import assert from "node:assert/strict"
import { test } from "node:test"

import { createHttpD1BatchDatabase } from "../src/core/db/d1-batch"

const credentials = {
  token: "test-token",
  accountId: "test-account",
  databaseId: "00000000-0000-4000-8000-000000000000",
}

test("D1 HTTP envía los statements como un único batch autenticado", async () => {
  let capturedUrl = ""
  let capturedInit: RequestInit | undefined
  const request = (async (url: string | URL | Request, init?: RequestInit) => {
    capturedUrl = String(url)
    capturedInit = init

    return Response.json({
      success: true,
      result: [
        { success: true, results: [{ id: "1" }] },
        { success: true, results: [] },
      ],
    })
  }) as typeof fetch
  const database = createHttpD1BatchDatabase(credentials, request)

  const results = await database.batch([
    database.prepare("UPDATE guests SET name = ? WHERE id = ?").bind("Ana", "1"),
    database.prepare("DELETE FROM guests WHERE id = ?").bind("2"),
  ])

  assert.equal(
    capturedUrl,
    "https://api.cloudflare.com/client/v4/accounts/test-account/d1/database/00000000-0000-4000-8000-000000000000/query",
  )
  assert.equal(
    new Headers(capturedInit?.headers).get("Authorization"),
    "Bearer test-token",
  )
  assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
    batch: [
      {
        sql: "UPDATE guests SET name = ? WHERE id = ?",
        params: ["Ana", "1"],
      },
      {
        sql: "DELETE FROM guests WHERE id = ?",
        params: ["2"],
      },
    ],
  })
  assert.deepEqual(results, [{ results: [{ id: "1" }] }, { results: [] }])
})

test("D1 HTTP propaga los errores legibles de Cloudflare", async () => {
  const request = (async () =>
    Response.json(
      {
        success: false,
        errors: [{ message: "not authorized" }],
      },
      { status: 403 },
    )) as typeof fetch
  const database = createHttpD1BatchDatabase(credentials, request)

  await assert.rejects(
    database.batch([database.prepare("DELETE FROM guests")]),
    /not authorized/,
  )
})

test("D1 HTTP rechaza parámetros que JSON no puede representar con seguridad", async () => {
  const database = createHttpD1BatchDatabase(credentials)

  await assert.rejects(
    database.batch([
      database.prepare("INSERT INTO files (content) VALUES (?)").bind(new Uint8Array()),
    ]),
    /no puede serializar/,
  )
})
