import type { Guest } from "@/domains/guests/domain/guest"

export interface CreateGuestInput {
  weddingId: string
  partyId?: string
  role?: Guest["role"]
  name: string
  email?: string | null
  phone?: string | null
  groupName?: string
  invite?: Guest["party"]["invite"]
  rsvp?: Guest["rsvp"]
  notes?: string
  uploadToken?: string | null
}

export type UpdateGuestInput = Partial<Omit<CreateGuestInput, "weddingId">>

export interface GuestInviteParty {
  id: string
  weddingId: string
  inviteToken: string
  groupName: string
  invite: Guest["party"]["invite"]
  guests: Guest[]
}

export interface InvitationPartyGuestInput {
  id?: string
  name: string
  email?: string | null
  phone?: string | null
  isRecipient: boolean
}

export interface CreateInvitationPartyInput {
  weddingId: string
  groupName?: string
  guests: InvitationPartyGuestInput[]
}

export interface UpdateInvitationPartyInput {
  weddingId: string
  groupName?: string
  guests: InvitationPartyGuestInput[]
}

export interface RespondToPartyGuestInput {
  guestId: string
  attending: boolean
  email?: string | null
  phone?: string | null
  notes?: string
  menuSelections?: Array<{
    menuDishId: string
    dishOptionId: string
  }>
}

export interface GuestRepository {
  listByWeddingId(weddingId: string): Promise<Guest[]>
  listPartiesByWeddingId(weddingId: string): Promise<GuestInviteParty[]>
  findPartyByInviteToken(inviteToken: string): Promise<GuestInviteParty | null>
  findById(id: string): Promise<Guest | null>
  create(input: CreateGuestInput): Promise<Guest>
  update(id: string, input: UpdateGuestInput): Promise<Guest | null>
  createInvitationParty(
    input: CreateInvitationPartyInput,
  ): Promise<GuestInviteParty>
  updateInvitationParty(
    partyId: string,
    input: UpdateInvitationPartyInput,
  ): Promise<GuestInviteParty | null>
  markPartiesInvited(weddingId: string, partyIds: string[]): Promise<Guest[]>
  respondToParty(
    inviteToken: string,
    rsvp: Guest["rsvp"],
  ): Promise<GuestInviteParty | null>
  respondToPartyWithDetails(
    inviteToken: string,
    input: {
      guests: RespondToPartyGuestInput[]
      message?: string | null
    },
  ): Promise<GuestInviteParty | null>
}
