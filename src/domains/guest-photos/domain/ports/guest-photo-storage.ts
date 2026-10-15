/**
 * Lo que la subida de fotos necesita del bucket. Lo cumple el almacenamiento
 * R2 por API S3 (DirectUploadMediaObjectStorage).
 */
export interface GuestPhotoStorage {
  createSignedUploadUrl(input: {
    key: string
    contentType: string
    expiresInSeconds: number
  }): Promise<string>
  readBytes(key: string): Promise<Uint8Array | null>
  put(input: {
    key: string
    body: Uint8Array<ArrayBuffer>
    contentType: string
    cacheControl?: string
  }): Promise<void>
  delete(key: string): Promise<void>
}
