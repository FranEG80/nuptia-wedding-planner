"use server"

import { revalidatePath } from "next/cache"

import { getRepositories } from "@/composition/repositories"
import { requireAppSession } from "@/core/auth"
import { isDemoSession } from "@/core/demo/is-demo-session"
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

function traceRsvp(event: string, details: Record<string, unknown> = {}) {
  console.info(
    "[nuptia:rsvp]",
    JSON.stringify({ event, ...details }),
  )
}

function traceRsvpError(error: unknown) {
  return error instanceof Error
    ? { errorName: error.name, errorMessage: error.message }
    : { errorName: typeof error }
}

export async function updateInvitationDesignAction(
  input: UpdateInvitationDesignDto,
) {
  const repositories = await getRepositories()
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return null
  }

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
  const traceId = crypto.randomUUID()

  traceRsvp("respond-action:start", {
    traceId,
    inputType: typeof input,
  })

  try {
    const repositories = await getRepositories()

    traceRsvp("respond-action:repositories-ready", { traceId })

    const parsed = publicInvitationResponseSchema.parse(input)

    traceRsvp("respond-action:input-validated", {
      traceId,
      guestCount: parsed.guests.length,
      attendingCount: parsed.guests.filter((guest) => guest.attending).length,
      selectionCount: parsed.guests.reduce(
        (count, guest) => count + guest.menuSelections.length,
        0,
      ),
      hasMessage: Boolean(parsed.message),
    })

    const party = await respondToPublicInvitationUseCase({
      guestRepository: repositories.guest,
      token: parsed.token,
      guests: parsed.guests,
      message: parsed.message,
    })

    traceRsvp("respond-action:use-case-complete", {
      traceId,
      partyFound: Boolean(party),
      guestCount: party?.guests.length ?? 0,
    })

    revalidatePath(`/i/${parsed.token}`)

    traceRsvp("respond-action:complete", { traceId })

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
  } catch (error) {
    console.error(
      "[nuptia:rsvp]",
      JSON.stringify({
        event: "respond-action:error",
        traceId,
        ...traceRsvpError(error),
      }),
    )
    throw error
  }
}
