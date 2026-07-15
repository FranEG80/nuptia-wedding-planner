"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import {
  parseInvitationContent,
  updateInvitationDesignSchema,
  type UpdateInvitationDesignDto,
} from "@/domains/invitations/application/dtos/invitation-design.dto"
import {
  normalizeInvitationColorPresetId,
  normalizeInvitationFontPairId,
} from "@/domains/invitations/domain/invitation-template-options"
import { respondToPublicInvitationUseCase } from "@/domains/invitations/application/use-cases/respond-to-public-invitation.use-case"
import { updateInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/update-invitation-design.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"

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

const publicResponseSchema = z.object({
  token: z.string().min(1),
  guests: z.array(
    z.object({
      id: z.string().min(1).optional(),
      clientId: z.string().min(1).optional(),
      role: z.enum(["primary", "companion"]).optional(),
      name: z.string().trim().min(1).max(140),
      email: optionalEmailSchema,
      phone: optionalPhoneSchema,
      notes: z
        .string()
        .trim()
        .max(600)
        .optional()
        .transform((value) => value ?? ""),
      rsvp: z.enum(["Confirmado", "Declinado"]),
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
  ).min(1),
  message: z
    .string()
    .trim()
    .max(1400)
    .optional()
    .transform((value) => (value ? value : null)),
})

export async function updateInvitationDesignAction(
  input: UpdateInvitationDesignDto,
) {
  const repositories = await getRepositories()
  const session = await requireAppSession()
  const parsed = updateInvitationDesignSchema.parse(input)
  const wedding = await getCurrentWeddingUseCase({
    weddingRepository: repositories.wedding,
    appUserId: session.appUser.id,
  })

  if (!wedding) {
    return null
  }

  const data: UpdateInvitationDesignDto = {
    ...parsed,
    titleFont: parsed.titleFont
      ? normalizeInvitationFontPairId(parsed.titleFont)
      : undefined,
    palette: parsed.palette
      ? normalizeInvitationColorPresetId(parsed.palette)
      : undefined,
    content: parsed.content ? parseInvitationContent(parsed.content) : undefined,
  }

  const design = await updateInvitationDesignUseCase({
    invitationRepository: repositories.invitation,
    weddingId: wedding.id,
    data,
  })

  revalidatePath("/app/invitacion")

  return design
}

export async function respondToInvitationAction(input: {
  token: string
  guests: Array<{
    id?: string
    clientId?: string
    role?: "primary" | "companion"
    name: string
    email: string | null
    phone?: string | null
    notes: string
    rsvp: "Confirmado" | "Declinado"
    menuSelections?: Array<{
      menuDishId: string
      dishOptionId: string
    }>
  }>
  message?: string | null
}) {
  const repositories = await getRepositories()
  const parsed = publicResponseSchema.parse(input)
  const party = await respondToPublicInvitationUseCase({
    guestRepository: repositories.guest,
    token: parsed.token,
    guests: parsed.guests,
    message: parsed.message,
  })

  revalidatePath(`/i/${parsed.token}`)

  return party
    ? {
        guests: party.guests.map((guest) => ({
          id: guest.id,
          role: guest.role,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          notes: guest.notes,
          rsvp: guest.rsvp,
          menuSelections: guest.menuSelections,
        })),
      }
    : null
}
