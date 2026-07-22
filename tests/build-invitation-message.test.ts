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

  it("usa el nombre de grupo cuando la invitación es para dos personas", () => {
    const party = makeParty({
      group: "Familia Novia",
      guests: [
        makeGuest({ firstName: "Ana", lastName: "Santos", isRecipient: true }),
        makeGuest({ firstName: "Luis", lastName: "Santos", isRecipient: false }),
      ],
    })

    assert.equal(buildInvitationGreeting(party), "Familia Novia")
  })

  it("recurre a los nombres combinados si la pareja no tiene grupo asignado", () => {
    const party = makeParty({
      group: "",
      guests: [
        makeGuest({ firstName: "Ana", lastName: "Santos", isRecipient: true }),
        makeGuest({ firstName: "Luis", lastName: "Santos", isRecipient: false }),
      ],
    })

    assert.equal(buildInvitationGreeting(party), "Ana Santos y Luis Santos")
  })
})

describe("buildInvitationMessage", () => {
  it("sustituye el saludo, los nombres combinados, el grupo y el enlace", () => {
    const party = makeParty({
      group: "Familia Novia",
      guests: [
        makeGuest({ firstName: "Ana", lastName: "Santos", isRecipient: true }),
        makeGuest({ firstName: "Luis", lastName: "Santos", isRecipient: false }),
      ],
    })
    const template =
      "Hola {guestName} ({inviteeNames} / {groupName}), confirma aquí: {inviteUrl}"

    assert.equal(
      buildInvitationMessage(party, template, "https://example.com/i/token-1"),
      "Hola Familia Novia (Ana Santos y Luis Santos / Familia Novia), confirma aquí: https://example.com/i/token-1",
    )
  })
})
