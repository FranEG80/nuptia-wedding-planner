export type WeddingMemberRole = "owner" | "partner" | "planner"

export interface WeddingMember {
  id: string
  weddingId: string
  appUserId: string
  role: WeddingMemberRole
  createdAt: string
}
