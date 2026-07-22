import { z } from "zod"

import type { GuestInviteParty } from "@/domains/guests/domain/ports/guest.repository"
import {
  toGuestDto,
  type GuestDto,
  type GuestInviteStatusDto,
} from "@/domains/guests/application/dtos/guest.dto"

const nullableContactSchema = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.union([z.string().min(1).max(160), z.literal(""), z.null()]).optional(),
  )
  .transform((value) => value || null)

const invitationGuestSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().transform((value) => value ?? ""),
  email: nullableContactSchema.refine(
    (value) => value === null || z.email().safeParse(value).success,
    "El email no es válido",
  ),
  phone: nullableContactSchema,
  isRecipient: z.boolean(),
})

function validatePartyMembers(
  data: { guests: Array<{ id?: string; email?: string | null; phone?: string | null; isRecipient: boolean }> },
  context: z.RefinementCtx,
) {
  const recipients = data.guests.filter((guest) => guest.isRecipient)

  if (recipients.length !== 1) {
    context.addIssue({
      code: "custom",
      path: ["guests"],
      message: "La invitación debe tener exactamente un destinatario",
    })
  }

  const recipient = recipients[0]

  if (recipient && !recipient.email && !recipient.phone) {
    context.addIssue({
      code: "custom",
      path: ["guests", data.guests.indexOf(recipient)],
      message: "El destinatario debe tener teléfono o email",
    })
  }

  const ids = data.guests.flatMap((guest) => (guest.id ? [guest.id] : []))

  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: "custom",
      path: ["guests"],
      message: "No se puede incluir dos veces al mismo invitado",
    })
  }
}

export const createInvitationPartySchema = z
  .object({
    groupName: z.string().trim().max(140).optional().transform((value) => value ?? ""),
    guests: z.array(invitationGuestSchema).min(1).max(2),
  })
  .superRefine(validatePartyMembers)

export const updateInvitationPartySchema = z
  .object({
    partyId: z.string().min(1),
    groupName: z.string().trim().max(140).optional().transform((value) => value ?? ""),
    guests: z
      .array(invitationGuestSchema.extend({ id: z.string().min(1).optional() }))
      .min(1)
      .max(2),
  })
  .superRefine(validatePartyMembers)

export type CreateInvitationPartyDto = z.input<typeof createInvitationPartySchema>
export type UpdateInvitationPartyDto = z.input<typeof updateInvitationPartySchema>

export interface InvitationPartyGuestDto extends GuestDto {
  isRecipient: boolean
}

export interface InvitationPartyMessageDto {
  id: string
  guestId: string
  message: string
  status: string
  createdAt: string
}

export interface InvitationPartyDto {
  id: string
  weddingId: string
  inviteToken: string
  group: string
  invite: GuestInviteStatusDto
  displayName: string
  inviteeNames: string
  recipient: InvitationPartyGuestDto
  guests: InvitationPartyGuestDto[]
  messages: InvitationPartyMessageDto[]
  compositionLocked: boolean
}

export function toInvitationPartyDto(
  party: GuestInviteParty,
): InvitationPartyDto {
  const guests = party.guests.map((guest) => ({
    ...toGuestDto(guest),
    isRecipient: guest.role === "primary",
  }))
  const recipient = guests.find((guest) => guest.isRecipient)

  if (!recipient) {
    throw new Error(`La invitación ${party.id} no tiene destinatario`)
  }

  const inviteeNames = guests.map((guest) => guest.name).join(" y ")

  return {
    id: party.id,
    weddingId: party.weddingId,
    inviteToken: party.inviteToken,
    group: party.groupName,
    invite: party.invite,
    displayName: `Invitación para ${inviteeNames}`,
    inviteeNames,
    recipient,
    guests,
    messages: party.messages.map((message) => ({
      id: message.id,
      guestId: message.guestId,
      message: message.message,
      status: message.status,
      createdAt: message.createdAt,
    })),
    compositionLocked:
      party.invite === "Enviada" ||
      guests.some((guest) => guest.rsvp !== "Sin respuesta"),
  }
}
