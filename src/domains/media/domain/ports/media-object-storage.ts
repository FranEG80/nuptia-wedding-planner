export interface PutMediaObjectInput {
  key: string
  body: ReadableStream<Uint8Array> | ArrayBuffer | Uint8Array<ArrayBuffer>
  contentType: string
  cacheControl?: string
}

export interface StoredMediaObject {
  body: ReadableStream<Uint8Array>
  contentType: string | null
  cacheControl: string | null
  etag: string
}

export interface MediaObjectStorage {
  put(input: PutMediaObjectInput): Promise<void>
  get(key: string): Promise<StoredMediaObject | null>
  delete(key: string): Promise<void>
}

export interface CreateSignedUploadUrlInput {
  key: string
  contentType: string
  expiresInSeconds: number
}

/**
 * Almacenamiento que además deja subir directamente desde el navegador con
 * una URL firmada (PUT) y leer un objeto completo en memoria.
 */
export interface DirectUploadMediaObjectStorage extends MediaObjectStorage {
  createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<string>
  readBytes(key: string): Promise<Uint8Array | null>
}
