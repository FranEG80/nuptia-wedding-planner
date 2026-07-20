import type { Guest, GuestInviteStatus, GuestRsvpStatus } from "@/domains/guests/domain/guest"

export type GuestInviteStatusDto = GuestInviteStatus
export type GuestRsvpStatusDto = GuestRsvpStatus

export interface GuestSeatDto {
  id: string
  tableId: string
  tableName: string
  position: number
}

export interface GuestInvitedByDto {
  weddingMemberId: string
  displayName: string
  roleCode: string
}

export interface GuestDto {
  id: string
  partyId: string
  weddingId: string
  appUserId: string | null
  role: Guest["role"]
  name: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  group: string
  invite: GuestInviteStatusDto
  rsvp: GuestRsvpStatusDto
  notes: string
  inviteToken: string
  uploadToken: string | null
  seat: GuestSeatDto | null
  invitedBy: GuestInvitedByDto[]
}

export interface CreateGuestDto {
  partyId?: string
  role?: Guest["role"]
  firstName: string
  lastName?: string
  email?: string | null
  phone?: string | null
  groupName?: string
  invite?: GuestInviteStatusDto
  rsvp?: GuestRsvpStatusDto
  notes?: string
  uploadToken?: string | null
}

export type UpdateGuestDto = Partial<CreateGuestDto>

export function toGuestDto(guest: Guest): GuestDto {
  return {
    id: guest.id,
    partyId: guest.partyId,
    weddingId: guest.weddingId,
    appUserId: guest.appUserId,
    role: guest.role,
    name: guest.name,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    group: guest.party.groupName,
    invite: guest.party.invite,
    rsvp: guest.rsvp,
    notes: guest.notes,
    inviteToken: guest.party.inviteToken,
    uploadToken: guest.uploadToken,
    seat: guest.seat
      ? {
          id: guest.seat.id,
          tableId: guest.seat.tableId,
          tableName: guest.seat.tableName,
          position: guest.seat.position,
        }
      : null,
    invitedBy: guest.invitedBy.map((item) => ({
      weddingMemberId: item.weddingMemberId,
      displayName: item.displayName,
      roleCode: item.roleCode,
    })),
  }
}
