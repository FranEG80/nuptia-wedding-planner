export type GuestRsvpStatus = "Confirmado" | "Declinado" | "Sin respuesta"
export type GuestInviteStatus = "Enviada" | "Pendiente"
export type GuestRole = "primary" | "companion"

export interface GuestParty {
  id: string
  weddingId: string
  inviteToken: string
  groupName: string
  invite: GuestInviteStatus
}

export interface GuestSeat {
  id: string
  tableId: string
  tableName: string
  position: number
}

export interface GuestInvitedBy {
  weddingMemberId: string
  displayName: string
  roleCode: string
}

export interface GuestMenuSelection {
  menuDishId: string
  dishOptionId: string
}

export interface GuestMessage {
  id: string
  weddingId: string
  guestId: string
  message: string
  status: string
  createdAt: string
}

export interface Guest {
  id: string
  partyId: string
  weddingId: string
  appUserId: string | null
  role: GuestRole
  name: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  rsvp: GuestRsvpStatus
  notes: string
  uploadToken: string | null
  party: GuestParty
  seat: GuestSeat | null
  invitedBy: GuestInvitedBy[]
  menuSelections: GuestMenuSelection[]
  messages: GuestMessage[]
}
