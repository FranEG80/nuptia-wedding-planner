import assert from "node:assert/strict"
import { describe, it, mock } from "node:test"

import { R2S3MediaObjectStorage } from "@/domains/media/adapters/r2/r2-s3-media-object-storage"
import type { PutMediaObjectInput } from "@/domains/media/domain/ports/media-object-storage"

describe("PUT de imágenes procesadas a R2", () => {
  it("conserva Content-Length tras firmar bytes, buffers y streams con aws4fetch", async () => {
    const sent: Request[] = []
    const fetch = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      sent.push(input instanceof Request ? input : new Request(input, init))
      return new Response(null, { status: 200 })
    })
    const storage = new R2S3MediaObjectStorage({
      accountId: "cuenta", accessKeyId: "clave", secretAccessKey: "secreto", bucketName: "nuptia-media",
    })
    const bytes = new Uint8Array([99, 1, 2, 3, 88]).subarray(1, 4)
    const bodies: PutMediaObjectInput["body"][] = [
      bytes,
      new Uint8Array([1, 2, 3]).buffer,
      new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close() } }),
    ]

    try {
      for (const body of bodies) {
        await storage.put({
          key: "weddings/test/optimized.webp", body, contentType: "image/webp",
          cacheControl: "public, max-age=31536000, immutable",
        })
        const request = sent.at(-1)!
        assert.equal(request.method, "PUT")
        assert.equal(request.headers.get("content-length"), "3")
        assert.equal(request.headers.get("content-type"), "image/webp")
        assert.equal(request.headers.get("cache-control"), "public, max-age=31536000, immutable")
        assert.match(request.headers.get("authorization")!, /^AWS4-HMAC-SHA256 /)
        assert.deepEqual(new Uint8Array(await request.arrayBuffer()), new Uint8Array([1, 2, 3]))
      }
      assert.equal(sent.length, 3)
    } finally { fetch.mock.restore() }
  })
})
