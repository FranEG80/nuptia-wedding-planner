export interface PutMediaObjectInput {
  key: string
  body: ReadableStream<Uint8Array> | ArrayBuffer
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
