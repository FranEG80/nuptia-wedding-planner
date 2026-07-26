import type { CreateInvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import type {
  InvitationPartyDto,
  InvitationPartyGuestDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import { joinSpanishNames } from "@/domains/guests/application/format-guest-names"

export function buildDemoInvitationParty(
  input: CreateInvitationPartyDto,
): InvitationPartyDto {
  const partyId = crypto.randomUUID()
  const inviteToken = crypto.randomUUID()
  const groupName = input.groupName ?? ""
  const invitationName = input.invitationName ?? ""

  const guests: InvitationPartyGuestDto[] = input.guests.map((draft) => {
    const firstName = draft.firstName.trim()
    const lastName = (draft.lastName ?? "").trim()

    return {
      id: crypto.randomUUID(),
      partyId,
      weddingId: "demo",
      appUserId: null,
      role: draft.isRecipient ? "primary" : "companion",
      name: [firstName, lastName].filter(Boolean).join(" "),
      firstName,
      lastName,
      email: draft.email ? String(draft.email) : null,
      phone: draft.phone ? String(draft.phone) : null,
      group: groupName,
      invite: "Pendiente",
      rsvp: "Sin respuesta",
      notes: "",
      inviteToken,
      uploadToken: null,
      seat: null,
      invitedBy: [],
      isRecipient: draft.isRecipient,
    }
  })

  const recipient = guests.find((guest) => guest.isRecipient) ?? guests[0]
  const inviteeNames = joinSpanishNames(guests.map((guest) => guest.name))

  return {
    id: partyId,
    weddingId: "demo",
    inviteToken,
    group: groupName,
    invitationName,
    invite: "Pendiente",
    displayName: `Invitación para ${inviteeNames}`,
    inviteeNames,
    recipient,
    guests,
    messages: [],
    compositionLocked: false,
  }
}
