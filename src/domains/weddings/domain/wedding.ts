export type WeddingStatus = "draft" | "published"
export type WeddingMemberRoleCode =
  | "owner"
  | "groom"
  | "bride"
  | "partner"
  | "planner"

export interface WeddingMemberRole {
  id: string
  code: WeddingMemberRoleCode
  label: string
  sortOrder: number
}

export interface WeddingMember {
  id: string
  weddingId: string
  appUserId: string | null
  role: WeddingMemberRole
  displayName: string | null
  sortOrder: number
}

export interface WeddingCeremonyLocation {
  id: string
  weddingId: string
  name: string
  address: string | null
  city: string
  mapsUrl: string | null
}

export interface RestaurantSummary {
  id: string
  name: string
  address: string | null
  city: string
  mapsUrl: string | null
}

export interface RestaurantMenuSummary {
  id: string
  restaurantId: string
  name: string
  description: string | null
}

export interface WeddingMenuDishOption {
  id: string
  name: string
  description: string | null
  sortOrder: number
}

export interface WeddingMenuDish {
  id: string
  dishId: string
  name: string
  description: string | null
  sortOrder: number
  options: WeddingMenuDishOption[]
}

export interface WeddingMenuDetails extends RestaurantMenuSummary {
  dishes: WeddingMenuDish[]
}

export interface Wedding {
  id: string
  ownerId: string
  slug: string
  date: string
  status: WeddingStatus
  partnerInviteCode: string | null
  partnerInviteEmail: string | null
  restaurantId: string | null
  menuId: string | null
  members: WeddingMember[]
  ceremonyLocation: WeddingCeremonyLocation | null
  restaurant: RestaurantSummary | null
  menu: RestaurantMenuSummary | null
}
