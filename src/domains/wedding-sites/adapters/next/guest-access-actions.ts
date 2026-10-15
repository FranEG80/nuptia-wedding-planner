"use server"

import { z } from "zod"

import { getRepositories } from "@/composition/repositories"
import { env } from "@/core/config/env"
import { parsePhoneList } from "@/domains/guests/domain/phone-key"
import { findGuestByPhoneUseCase } from "@/domains/guests/application/use-cases/find-guest-by-phone.use-case"
import { getPublicWeddingSiteUseCase } from "@/domains/wedding-sites/application/use-cases/get-public-wedding-site.use-case"

const verifyGuestPhoneSchema = z.object({
  slug: z.string().min(1).max(200),
  phone: z.string().max(40),
})

export type VerifyGuestPhoneResult =
  | {
      status: "found"
      guest: {
        id: string
        firstName: string
        fullName: string
        partyName: string | null
      }
    }
  | { status: "photographer" }
  | { status: "invalid_phone" }
  | { status: "not_found" }
  | { status: "unavailable" }

/**
 * Acceso público a la web: no requiere sesión. Los errores esperables se
 * devuelven como estado, no como excepción.
 */
export async function verifyGuestPhoneAction(
  input: unknown,
): Promise<VerifyGuestPhoneResult> {
  const parsed = verifyGuestPhoneSchema.safeParse(input)

  if (!parsed.success) {
    return { status: "invalid_phone" }
  }

  const repositories = await getRepositories()
  const site = await getPublicWeddingSiteUseCase({
    weddingSiteRepository: repositories.weddingSite,
    slug: parsed.data.slug,
  })

  if (!site) {
    return { status: "unavailable" }
  }

  const result = await findGuestByPhoneUseCase({
    guestRepository: repositories.guest,
    weddingId: site.wedding.id,
    phone: parsed.data.phone,
    photographerPhoneKeys: parsePhoneList(env.WEDDING_PHOTOGRAPHER_PHONES),
  })

  if (result.status !== "found") {
    return result
  }

  const identity = await repositories.guest.findWallIdentity(
    site.wedding.id,
    result.guest.id,
  )

  return {
    status: "found",
    guest: {
      id: result.guest.id,
      firstName: result.guest.firstName,
      fullName: identity?.fullName ?? result.guest.firstName,
      partyName: identity?.partyName ?? null,
    },
  }
}
