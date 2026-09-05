import { z } from "zod"

import { MAX_INVITATION_GUESTS } from "@/domains/guests/domain/invitation-party-limits"

export const respondInvitationPartySchema = z.object({
  token: z.string().min(1),
  guests: z
    .array(
      z.object({
        guestId: z.string().min(1),
        attending: z.boolean(),
        notes: z
          .string()
          .trim()
          .max(600)
          .optional()
          .transform((value) => value ?? ""),
      }),
    )
    .min(1)
    .max(MAX_INVITATION_GUESTS),
  message: z
    .string()
    .trim()
    .max(1400)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
})

export type RespondInvitationPartyDto = z.input<typeof respondInvitationPartySchema>
