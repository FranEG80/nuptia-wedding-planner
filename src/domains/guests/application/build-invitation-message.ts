import type { InvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"

export function buildInvitationGreeting(party: InvitationPartyDto): string {
  if (party.guests.length <= 1) {
    return party.recipient.firstName || party.recipient.name || "invitado"
  }

  return party.group || party.inviteeNames
}

export function buildInvitationMessage(
  party: InvitationPartyDto,
  template: string,
  inviteUrl: string,
): string {
  return template
    .replaceAll("{guestName}", buildInvitationGreeting(party))
    .replaceAll("{inviteeNames}", party.inviteeNames)
    .replaceAll("{groupName}", party.group || party.inviteeNames)
    .replaceAll("{inviteUrl}", inviteUrl)
}
