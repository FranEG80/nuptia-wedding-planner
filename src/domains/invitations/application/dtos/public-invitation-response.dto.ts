import { z } from "zod"

const optionalEmailSchema = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.union([z.string().email(), z.literal("")]).optional(),
  )
  .transform((value) => value || null)

const optionalPhoneSchema = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.union([z.string().min(3).max(40), z.literal("")]).optional(),
  )
  .transform((value) => value || null)

export const publicInvitationResponseSchema = z.object({
  token: z.string().min(1),
  guests: z
    .array(
      z.object({
        guestId: z.string().min(1),
        attending: z.boolean(),
        email: optionalEmailSchema,
        phone: optionalPhoneSchema,
        notes: z
          .string()
          .trim()
          .max(600)
          .optional()
          .transform((value) => value ?? ""),
        menuSelections: z
          .array(
            z.object({
              menuDishId: z.string().min(1),
              dishOptionId: z.string().min(1),
            }),
          )
          .optional()
          .transform((value) => value ?? []),
      }),
    )
    .min(1)
    .max(2)
    .superRefine((guests, context) => {
      const ids = guests.map((guest) => guest.guestId)

      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: "custom",
          message: "No se puede responder dos veces por el mismo invitado",
        })
      }
    }),
  message: z
    .string()
    .trim()
    .max(1400)
    .optional()
    .transform((value) => (value ? value : null)),
})

export type PublicInvitationResponseDto = z.input<
  typeof publicInvitationResponseSchema
>
