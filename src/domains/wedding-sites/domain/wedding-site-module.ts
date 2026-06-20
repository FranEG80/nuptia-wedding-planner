export type WeddingSiteModuleType =
  | "location"
  | "menu"
  | "timeline"
  | "gifts"
  | "spotify"
  | "gallery"
  | "guestbook"

export interface WeddingSiteModule {
  id: string
  weddingId: string
  type: WeddingSiteModuleType
  title: string
  desc: string
  enabled: boolean
  sortOrder: number
}

export interface WeddingTimelineItem {
  time: string
  label: string
  icon: string
}
