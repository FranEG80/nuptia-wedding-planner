import type { InvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import { joinSpanishNames } from "@/domains/guests/application/format-guest-names"

export function buildInvitationGreeting(party: InvitationPartyDto): string {
  if (party.guests.length <= 1) {
    return party.recipient.firstName || party.recipient.name || "invitado"
  }

  const firstNames = joinSpanishNames(
    party.guests.map((guest) => guest.firstName.trim() || guest.name),
  )

  return party.invitationName.trim() || firstNames
}

export function buildInvitationMessage(
  party: InvitationPartyDto,
  template: string,
  inviteUrl: string,
): string {
  const invitationVerb = party.guests.length > 1 ? "invitaros" : "invitarte"
  const firstNames = joinSpanishNames(
    party.guests.map((guest) => guest.firstName.trim() || guest.name),
  )

  return template
    .replaceAll("{guestName}", buildInvitationGreeting(party))
    .replaceAll("{inviteeNames}", firstNames)
    .replaceAll(
      "{groupName}",
      party.invitationName.trim() || firstNames,
    )
    .replaceAll("{inviteUrl}", inviteUrl)
    // Keep adapting existing templates that still contain the old literal.
    .replaceAll("invitarte", invitationVerb)
}
