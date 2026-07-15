export function assertExactPartyResponses(
  partyGuestIds: string[],
  responseGuestIds: string[],
) {
  const expectedIds = new Set(partyGuestIds)
  const submittedIds = new Set(responseGuestIds)

  if (
    responseGuestIds.length !== partyGuestIds.length ||
    submittedIds.size !== responseGuestIds.length ||
    responseGuestIds.some((id) => !expectedIds.has(id)) ||
    partyGuestIds.some((id) => !submittedIds.has(id))
  ) {
    throw new Error(
      "La respuesta debe incluir una única respuesta para cada invitado del enlace",
    )
  }
}
