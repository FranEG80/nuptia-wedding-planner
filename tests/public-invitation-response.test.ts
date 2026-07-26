import assert from "node:assert/strict"
import test from "node:test"

import { publicInvitationResponseSchema } from "@/domains/invitations/application/dtos/public-invitation-response.dto"

test("acepta la respuesta pública con contactos y mensaje nulos", () => {
  const parsed = publicInvitationResponseSchema.parse({
    token: "invitation-token",
    guests: [
      {
        guestId: "guest-id",
        attending: true,
        email: null,
        phone: "622943008",
        notes: "",
        menuSelections: [],
      },
    ],
    message: null,
  })

  assert.equal(parsed.guests[0].email, null)
  assert.equal(parsed.guests[0].phone, "622943008")
  assert.equal(parsed.message, null)
})
