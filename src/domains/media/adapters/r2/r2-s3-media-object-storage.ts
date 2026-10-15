import { AwsClient } from "aws4fetch"

import type {
  CreateSignedUploadUrlInput,
  DirectUploadMediaObjectStorage,
  PutMediaObjectInput,
  StoredMediaObject,
} from "@/domains/media/domain/ports/media-object-storage"

export interface R2S3Credentials {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
}

function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/")
}

/**
 * Id de cuenta de Cloudflare a partir de R2_ACCOUNT_ID. Acepta el id (32 hex)
 * o el endpoint S3 que enseña Cloudflare al crear el token
 * (https://<id>.r2.cloudflarestorage.com), que es fácil pegar entero.
 */
export function normalizeR2AccountId(value: string) {
  const trimmed = value.trim()
  return /\b([0-9a-f]{32})\b/i.exec(trimmed)?.[1] ?? trimmed
}

/**
 * R2 a través de su API compatible con S3. Funciona fuera de Cloudflare (por
 * ejemplo en Vercel) y permite firmar subidas directas desde el navegador.
 */
export class R2S3MediaObjectStorage implements DirectUploadMediaObjectStorage {
  private readonly client: AwsClient
  private readonly bucketUrl: string

  constructor(credentials: R2S3Credentials) {
    this.client = new AwsClient({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      service: "s3",
      region: "auto",
    })
    this.bucketUrl =
      `https://${normalizeR2AccountId(credentials.accountId)}.r2.cloudflarestorage.com/` +
      encodeURIComponent(credentials.bucketName)
  }

  private objectUrl(key: string) {
    return `${this.bucketUrl}/${encodeKey(key)}`
  }

  async put(input: PutMediaObjectInput): Promise<void> {
    // Firmar un stream exige conocer su tamaño: se lee entero antes de enviar.
    const body =
      input.body instanceof ReadableStream
        ? await new Response(input.body).arrayBuffer()
        : input.body
    // aws4fetch entrega a fetch un Request cuyo body ya es un stream. En
    // Node/Vercel se pierde la longitud inferida y R2 rechaza el PUT con 411.
    const headers: Record<string, string> = {
      "Content-Type": input.contentType,
      "Content-Length": String(body.byteLength),
    }

    if (input.cacheControl) {
      headers["Cache-Control"] = input.cacheControl
    }

    const response = await this.client.fetch(this.objectUrl(input.key), {
      method: "PUT",
      body,
      headers,
    })

    if (!response.ok) {
      throw new Error(`R2 rechazó la subida de ${input.key} (HTTP ${response.status})`)
    }
  }

  async get(key: string): Promise<StoredMediaObject | null> {
    const response = await this.client.fetch(this.objectUrl(key))

    if (response.status === 404) {
      return null
    }

    if (!response.ok || !response.body) {
      throw new Error(`R2 no devolvió ${key} (HTTP ${response.status})`)
    }

    return {
      body: response.body,
      contentType: response.headers.get("content-type"),
      cacheControl: response.headers.get("cache-control"),
      etag: response.headers.get("etag") ?? "",
    }
  }

  async readBytes(key: string): Promise<Uint8Array | null> {
    const response = await this.client.fetch(this.objectUrl(key))

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`R2 no devolvió ${key} (HTTP ${response.status})`)
    }

    return new Uint8Array(await response.arrayBuffer())
  }

  async delete(key: string): Promise<void> {
    const response = await this.client.fetch(this.objectUrl(key), { method: "DELETE" })

    if (!response.ok && response.status !== 404) {
      throw new Error(`R2 no borró ${key} (HTTP ${response.status})`)
    }
  }

  async createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<string> {
    const url = new URL(this.objectUrl(input.key))
    url.searchParams.set("X-Amz-Expires", String(input.expiresInSeconds))

    // Content-Type entra en la firma (aws4fetch lo excluye salvo con
    // allHeaders): el navegador debe enviar exactamente ese tipo.
    const signed = await this.client.sign(url, {
      method: "PUT",
      headers: { "Content-Type": input.contentType },
      aws: { signQuery: true, allHeaders: true },
    })

    return signed.url
  }
}
