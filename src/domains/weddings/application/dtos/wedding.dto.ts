import type {
  RestaurantMenuSummary,
  RestaurantSummary,
  Wedding,
  WeddingCeremonyLocation,
  WeddingMember,
  WeddingMemberRole,
  WeddingMemberRoleCode,
} from "@/domains/weddings/domain/wedding"

export interface WeddingMemberRoleDto {
  id: string
  code: WeddingMemberRoleCode
  label: string
  sortOrder: number
}

export interface WeddingMemberDto {
  id: string
  weddingId: string
  appUserId: string | null
  role: WeddingMemberRoleDto
  displayName: string | null
  sortOrder: number
}

export interface WeddingCeremonyLocationDto {
  id: string
  name: string
  address: string | null
  city: string
  mapsUrl: string | null
}

export interface RestaurantSummaryDto {
  id: string
  name: string
  address: string | null
  city: string
  mapsUrl: string | null
}

export interface RestaurantMenuSummaryDto {
  id: string
  restaurantId: string
  name: string
  description: string | null
}

export interface WeddingDto {
  id: string
  ownerId: string
  slug: string
  date: string
  status: Wedding["status"]
  partnerInviteCode: string | null
  partnerInviteEmail: string | null
  restaurantId: string | null
  menuId: string | null
  members: WeddingMemberDto[]
  partnerNames: string[]
  displayName: string
  ceremonyLocation: WeddingCeremonyLocationDto | null
  restaurant: RestaurantSummaryDto | null
  menu: RestaurantMenuSummaryDto | null
  primaryCity: string
}

export interface CreateWeddingDto {
  partnerNames: [string, string]
  date: string
}

export interface UpdateWeddingDto {
  partnerNames?: [string, string]
  date?: string
  status?: Wedding["status"]
  restaurantId?: string | null
  menuId?: string | null
}

const partnerRoleCodes = new Set<WeddingMemberRoleCode>([
  "groom",
  "bride",
  "partner",
])

function toWeddingMemberRoleDto(role: WeddingMemberRole): WeddingMemberRoleDto {
  return {
    id: role.id,
    code: role.code,
    label: role.label,
    sortOrder: role.sortOrder,
  }
}

function toWeddingMemberDto(member: WeddingMember): WeddingMemberDto {
  return {
    id: member.id,
    weddingId: member.weddingId,
    appUserId: member.appUserId,
    role: toWeddingMemberRoleDto(member.role),
    displayName: member.displayName,
    sortOrder: member.sortOrder,
  }
}

function toWeddingCeremonyLocationDto(
  location: WeddingCeremonyLocation,
): WeddingCeremonyLocationDto {
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    mapsUrl: location.mapsUrl,
  }
}

function toRestaurantSummaryDto(
  restaurant: RestaurantSummary,
): RestaurantSummaryDto {
  return {
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city,
    mapsUrl: restaurant.mapsUrl,
  }
}

function toRestaurantMenuSummaryDto(
  menu: RestaurantMenuSummary,
): RestaurantMenuSummaryDto {
  return {
    id: menu.id,
    restaurantId: menu.restaurantId,
    name: menu.name,
    description: menu.description,
  }
}

function partnerNamesFromMembers(members: WeddingMember[]) {
  return members
    .filter((member) => partnerRoleCodes.has(member.role.code))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.role.sortOrder - b.role.sortOrder)
    .map((member) => member.displayName)
    .filter((name): name is string => Boolean(name?.trim()))
}

export function toWeddingDto(wedding: Wedding): WeddingDto {
  const partnerNames = partnerNamesFromMembers(wedding.members)
  const displayName =
    partnerNames.length > 0 ? partnerNames.join(" & ") : "Nuestra boda"

  return {
    id: wedding.id,
    ownerId: wedding.ownerId,
    slug: wedding.slug,
    date: wedding.date,
    status: wedding.status,
    partnerInviteCode: wedding.partnerInviteCode,
    partnerInviteEmail: wedding.partnerInviteEmail,
    restaurantId: wedding.restaurantId,
    menuId: wedding.menuId,
    members: wedding.members.map(toWeddingMemberDto),
    partnerNames,
    displayName,
    ceremonyLocation: wedding.ceremonyLocation
      ? toWeddingCeremonyLocationDto(wedding.ceremonyLocation)
      : null,
    restaurant: wedding.restaurant
      ? toRestaurantSummaryDto(wedding.restaurant)
      : null,
    menu: wedding.menu ? toRestaurantMenuSummaryDto(wedding.menu) : null,
    primaryCity:
      wedding.ceremonyLocation?.city ??
      wedding.restaurant?.city ??
      "vuestra ciudad",
  }
}
