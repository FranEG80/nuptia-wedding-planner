"use server"

import { revalidatePath } from "next/cache"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import {
  parseInvitationContent,
  updateInvitationDesignSchema,
  type UpdateInvitationDesignDto,
} from "@/domains/invitations/application/dtos/invitation-design.dto"
import { publicInvitationResponseSchema } from "@/domains/invitations/application/dtos/public-invitation-response.dto"
import {
  normalizeInvitationColorPresetId,
  normalizeInvitationFontPairId,
} from "@/domains/invitations/domain/invitation-template-options"
import { respondToPublicInvitationUseCase } from "@/domains/invitations/application/use-cases/respond-to-public-invitation.use-case"
import { updateInvitationDesignUseCase } from "@/domains/invitations/application/use-cases/update-invitation-design.use-case"
import { getCurrentWeddingUseCase } from "@/domains/weddings/application/use-cases/get-current-wedding.use-case"
import { NACHO_WEDDING_SLUG } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"

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
    // Esta boda usa un diseño realizado a medida; no debe poder sustituirse
    // desde una petición modificada fuera del selector del panel.
    templateId:
      wedding.slug === NACHO_WEDDING_SLUG
        ? "maria-daniela"
        : parsed.templateId,
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

export async function respondToInvitationAction(input: unknown) {
  const repositories = await getRepositories()
  const parsed = publicInvitationResponseSchema.parse(input)
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
