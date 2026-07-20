import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  createInvitationPartySchema,
  updateInvitationPartySchema,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import { assertExactPartyResponses } from "@/domains/guests/domain/invitation-party-rules"
import { publicInvitationResponseSchema } from "@/domains/invitations/application/dtos/public-invitation-response.dto"

const ana = {
  firstName: "Ana",
  lastName: "",
  email: "ana@example.com",
  phone: null,
  isRecipient: true,
}

const luis = {
  firstName: "Luis",
  lastName: "",
  email: null,
  phone: null,
  isRecipient: false,
}

describe("invitaciones compartidas", () => {
  it("acepta invitaciones individuales y de pareja", () => {
    assert.equal(
      createInvitationPartySchema.safeParse({ guests: [ana] }).success,
      true,
    )
    assert.equal(
      createInvitationPartySchema.safeParse({ guests: [ana, luis] }).success,
      true,
    )
    assert.equal(
      createInvitationPartySchema.safeParse({
        guests: [
          { ...ana, isRecipient: false },
          { ...luis, phone: "+34600000000", isRecipient: true },
        ],
      }).success,
      true,
    )
  })

  it("rechaza un tercer invitado y grupos sin destinatario válido", () => {
    assert.equal(
      createInvitationPartySchema.safeParse({
        guests: [ana, luis, { ...luis, firstName: "Marta" }],
      }).success,
      false,
    )
    assert.equal(
      createInvitationPartySchema.safeParse({
        guests: [
          { ...ana, email: null, isRecipient: false },
          { ...luis, isRecipient: false },
        ],
      }).success,
      false,
    )
    assert.equal(
      createInvitationPartySchema.safeParse({
        guests: [{ ...ana, email: null, phone: null }],
      }).success,
      false,
    )
  })

  it("rechaza IDs duplicados al editar", () => {
    const result = updateInvitationPartySchema.safeParse({
      partyId: "party-1",
      guests: [
        { ...ana, id: "guest-1" },
        { ...luis, id: "guest-1" },
      ],
    })

    assert.equal(result.success, false)
  })

  it("exige una respuesta exacta para cada ID del token", () => {
    assert.doesNotThrow(() =>
      assertExactPartyResponses(
        ["guest-1", "guest-2"],
        ["guest-2", "guest-1"],
      ),
    )
    assert.throws(() =>
      assertExactPartyResponses(
        ["guest-1", "guest-2"],
        ["guest-1", "foreign"],
      ),
    )
    assert.throws(() =>
      assertExactPartyResponses(
        ["guest-1", "guest-2"],
        ["guest-1", "guest-1"],
      ),
    )
    assert.throws(() =>
      assertExactPartyResponses(["guest-1", "guest-2"], ["guest-1"]),
    )
  })

  it("acepta los cuatro resultados de asistencia y rechaza IDs duplicados", () => {
    for (const attendance of [
      [true, true],
      [true, false],
      [false, true],
      [false, false],
    ]) {
      const result = publicInvitationResponseSchema.safeParse({
        token: "token",
        guests: [
          { guestId: "guest-1", attending: attendance[0] },
          { guestId: "guest-2", attending: attendance[1] },
        ],
      })

      assert.equal(result.success, true)
    }

    assert.equal(
      publicInvitationResponseSchema.safeParse({
        token: "token",
        guests: [
          { guestId: "guest-1", attending: true },
          { guestId: "guest-1", attending: false },
        ],
      }).success,
      false,
    )
  })
})
