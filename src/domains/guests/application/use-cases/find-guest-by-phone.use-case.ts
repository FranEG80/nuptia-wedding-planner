import { normalizePhoneForWhatsapp } from "@/domains/guests/application/normalize-phone"
import { toPhoneKey } from "@/domains/guests/domain/phone-key"
import type { GuestRepository } from "@/domains/guests/domain/ports/guest.repository"

const MIN_PHONE_DIGITS = 9

export type GuestPhoneLookupResult =
  | { status: "found"; guest: { id: string; firstName: string } }
  | { status: "photographer" }
  | { status: "invalid_phone" }
  | { status: "not_found" }

/**
 * Confirma que un teléfono figura en la lista de invitados de la boda o en la
 * de fotógrafos. No es una autenticación: solo valida el número. Si varios
 * invitados comparten teléfono, se devuelve el titular de la invitación.
 */
export async function findGuestByPhoneUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  phone: string
  /** Claves de teléfono (últimos nueve dígitos) de los fotógrafos de la boda. */
  photographerPhoneKeys?: string[]
}): Promise<GuestPhoneLookupResult> {
  const phone = normalizePhoneForWhatsapp(input.phone)

  if (!phone || phone.length < MIN_PHONE_DIGITS) {
    return { status: "invalid_phone" }
  }

  const phoneKey = toPhoneKey(input.phone)

  if (phoneKey && input.photographerPhoneKeys?.includes(phoneKey)) {
    return { status: "photographer" }
  }

  const candidates = await input.guestRepository.listPhoneCandidatesByWeddingId(
    input.weddingId,
  )
  const matches = candidates.filter(
    (candidate) => normalizePhoneForWhatsapp(candidate.phone) === phone,
  )
  const guest = matches.find((candidate) => candidate.role === "primary") ?? matches[0]

  if (!guest) {
    return { status: "not_found" }
  }

  return { status: "found", guest: { id: guest.id, firstName: guest.firstName } }
}
