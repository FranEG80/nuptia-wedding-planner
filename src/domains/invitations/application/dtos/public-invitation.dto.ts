import type { PublicGuestInviteParty } from "@/domains/guests/domain/ports/guest.repository"
import type { Guest } from "@/domains/guests/domain/guest"
import type { InvitationDesign } from "@/domains/invitations/domain/invitation-design"
import {
  toInvitationDesignDto,
  type InvitationDesignDto,
} from "@/domains/invitations/application/dtos/invitation-design.dto"
import type {
  Wedding,
  WeddingMenuDetails,
} from "@/domains/weddings/domain/wedding"
import {
  toWeddingDto,
  type WeddingDto,
} from "@/domains/weddings/application/dtos/wedding.dto"

export type PublicInvitationWeddingDto = Pick<
  WeddingDto,
  | "id"
  | "slug"
  | "date"
  | "partnerNames"
  | "displayName"
  | "ceremonyLocation"
  | "restaurant"
  | "primaryCity"
>

export interface PublicInvitationGuestDto {
  id: string
  role: Guest["role"]
  name: string
  email: string | null
  phone: string | null
  notes: string
  rsvp: Guest["rsvp"]
  menuSelections: Array<{
    menuDishId: string
    dishOptionId: string
  }>
}

export interface PublicInvitationMenuDto {
  id: string
  name: string
  description: string | null
  dishes: Array<{
    id: string
    name: string
    description: string | null
    options: Array<{
      id: string
      name: string
      description: string | null
    }>
  }>
}

export interface PublicInvitationDto {
  token: string
  partyId: string
  groupName: string
  wedding: PublicInvitationWeddingDto
  design: InvitationDesignDto
  guests: PublicInvitationGuestDto[]
  menu: PublicInvitationMenuDto | null
}

export function toPublicInvitationDto(input: {
  party: PublicGuestInviteParty
  wedding: Wedding
  design: InvitationDesign
  menu: WeddingMenuDetails | null
}): PublicInvitationDto {
  const wedding = toWeddingDto(input.wedding)

  return {
    token: input.party.inviteToken,
    partyId: input.party.id,
    groupName: input.party.groupName,
    wedding: {
      id: wedding.id,
      slug: wedding.slug,
      date: wedding.date,
      partnerNames: wedding.partnerNames,
      displayName: wedding.displayName,
      ceremonyLocation: wedding.ceremonyLocation,
      restaurant: wedding.restaurant,
      primaryCity: wedding.primaryCity,
    },
    design: toInvitationDesignDto(input.design),
    guests: input.party.guests.map((guest) => ({
      id: guest.id,
      role: guest.role,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      notes: guest.notes,
      rsvp: guest.rsvp,
      menuSelections: guest.menuSelections,
    })),
    menu: input.menu
      ? {
          id: input.menu.id,
          name: input.menu.name,
          description: input.menu.description,
          dishes: input.menu.dishes.map((dish) => ({
            id: dish.id,
            name: dish.name,
            description: dish.description,
            options: dish.options.map((option) => ({
              id: option.id,
              name: option.name,
              description: option.description,
            })),
          })),
        }
      : null,
  }
}
