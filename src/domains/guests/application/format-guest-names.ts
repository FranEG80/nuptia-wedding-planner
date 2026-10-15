export function joinSpanishNames(names: string[]): string {
  const cleanNames = names.map((name) => name.trim()).filter(Boolean)

  if (cleanNames.length <= 1) {
    return cleanNames[0] ?? ""
  }

  const lastName = cleanNames.at(-1)!
  return `${cleanNames.slice(0, -1).join(", ")} y ${lastName}`
}

/**
 * Nombre conjunto de una invitación para firmar en el muro de la web, o null
 * si la invitación es de una sola persona.
 */
export function getWallPartyName(party: {
  invitationName: string
  guests: Array<{ firstName: string; name: string }>
}): string | null {
  if (party.guests.length <= 1) {
    return null
  }

  return (
    party.invitationName.trim() ||
    joinSpanishNames(
      party.guests.map((guest) => guest.firstName.trim() || guest.name),
    )
  ) || null
}

export function getInvitationListLabel(party: {
  invitationName: string
  inviteeNames: string
  guests: Array<{ firstName: string; name: string }>
}): string {
  if (party.guests.length <= 1) {
    return party.inviteeNames
  }

  return (
    party.invitationName.trim() ||
    joinSpanishNames(
      party.guests.map((guest) => guest.firstName.trim() || guest.name),
    )
  )
}
