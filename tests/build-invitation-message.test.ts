import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildInvitationGreeting,
  buildInvitationMessage,
} from "@/domains/guests/application/build-invitation-message"
import type {
  InvitationPartyDto,
  InvitationPartyGuestDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"

function makeGuest(
  overrides: Partial<InvitationPartyGuestDto> & { firstName: string; lastName?: string },
): InvitationPartyGuestDto {
  const lastName = overrides.lastName ?? ""
  const name = [overrides.firstName, lastName].filter(Boolean).join(" ")

  return {
    id: overrides.id ?? `guest-${overrides.firstName}`,
    partyId: "party-1",
    weddingId: "wedding-1",
    appUserId: null,
    role: overrides.isRecipient ? "primary" : "companion",
    name,
    firstName: overrides.firstName,
    lastName,
    email: overrides.email ?? null,
    phone: overrides.phone ?? null,
    group: "",
    invite: "Pendiente",
    rsvp: "Sin respuesta",
    notes: "",
    inviteToken: "token-1",
    uploadToken: null,
    seat: null,
    invitedBy: [],
    isRecipient: overrides.isRecipient ?? false,
  }
}

function makeParty(overrides: {
  group?: string
  invitationName?: string
  guests: InvitationPartyGuestDto[]
}): InvitationPartyDto {
  const recipient = overrides.guests.find((guest) => guest.isRecipient)

  if (!recipient) {
    throw new Error("La party de prueba necesita un destinatario")
  }

  const inviteeNames = overrides.guests.map((guest) => guest.name).join(" y ")

  return {
    id: "party-1",
    weddingId: "wedding-1",
    inviteToken: "token-1",
    group: overrides.group ?? "",
    invitationName: overrides.invitationName ?? "",
    invite: "Pendiente",
    displayName: `Invitación para ${inviteeNames}`,
    inviteeNames,
    recipient,
    guests: overrides.guests,
    messages: [],
    compositionLocked: false,
  }
}

describe("buildInvitationGreeting", () => {
  it("usa el nombre de pila cuando la invitación es para una sola persona", () => {
    const party = makeParty({
      guests: [makeGuest({ firstName: "Ana", lastName: "Santos", isRecipient: true })],
    })

    assert.equal(buildInvitationGreeting(party), "Ana")
  })

  it("usa el nombre de la invitación conjunta y no el Grupo interno", () => {
    const party = makeParty({
      group: "Familia Novia",
      invitationName: "Ana y Luis",
      guests: [
        makeGuest({ firstName: "Ana", lastName: "Santos", isRecipient: true }),
        makeGuest({ firstName: "Luis", lastName: "Santos", isRecipient: false }),
      ],
    })

    assert.equal(buildInvitationGreeting(party), "Ana y Luis")
  })

  it("recurre a los nombres combinados si no hay nombre conjunto", () => {
    const party = makeParty({
      group: "Familia interna",
      guests: [
        makeGuest({ firstName: "Ana", lastName: "Santos", isRecipient: true }),
        makeGuest({ firstName: "Luis", lastName: "Santos", isRecipient: false }),
      ],
    })

    assert.equal(buildInvitationGreeting(party), "Ana y Luis")
  })
})

describe("buildInvitationMessage", () => {
  it("usa el plural y solo los nombres cuando la invitación es para dos personas", () => {
    const party = makeParty({
      group: "",
      guests: [
        makeGuest({ firstName: "Ana", lastName: "Santos", isRecipient: true }),
        makeGuest({ firstName: "Luis", lastName: "Santos", isRecipient: false }),
      ],
    })
    const template =
      "Hola {guestName}, nos hace mucha ilusión invitarte a nuestra boda. {inviteUrl}"

    assert.equal(
      buildInvitationMessage(party, template, "https://example.com/i/token-1"),
      "Hola Ana y Luis, nos hace mucha ilusión invitaros a nuestra boda. https://example.com/i/token-1",
    )
  })

  it("mantiene el nombre visible y adapta el verbo al plural", () => {
    const party = makeParty({
      group: "Familia Novia",
      invitationName: "Familia Santos",
      guests: [
        makeGuest({ firstName: "Ana", lastName: "Santos", isRecipient: true }),
        makeGuest({ firstName: "Luis", lastName: "Santos", isRecipient: false }),
      ],
    })
    const template =
      "Hola {guestName}, nos hace mucha ilusión invitarte ({inviteeNames} / {groupName}): {inviteUrl}"

    assert.equal(
      buildInvitationMessage(party, template, "https://example.com/i/token-1"),
      "Hola Familia Santos, nos hace mucha ilusión invitaros (Ana y Luis / Familia Santos): https://example.com/i/token-1",
    )
  })

  it("mantiene el singular para una invitación individual", () => {
    const party = makeParty({
      guests: [makeGuest({ firstName: "Ana", lastName: "Santos", isRecipient: true })],
    })

    assert.equal(
      buildInvitationMessage(
        party,
        "Hola {guestName}, nos hace mucha ilusión invitarte.",
        "https://example.com/i/token-1",
      ),
      "Hola Ana, nos hace mucha ilusión invitarte.",
    )
  })
})
