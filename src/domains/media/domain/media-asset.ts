export interface MediaAsset {
  id: string
  weddingId: string
  type: "image" | "audio" | "video"
  provider: "local" | "supabase"
  key: string
  url: string
  alt: string | null
}
