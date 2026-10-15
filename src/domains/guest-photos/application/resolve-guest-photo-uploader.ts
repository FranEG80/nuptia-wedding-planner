import { toPhoneKey } from "@/domains/guests/domain/phone-key"
import type {
  GuestRepository,
  GuestWallIdentity,
} from "@/domains/guests/domain/ports/guest.repository"
import type {
  GuestPhotoCreditChoice,
  GuestPhotoUploaderClaim,
} from "@/domains/guest-photos/domain/guest-photo"
import { normalizeCustomCredit } from "@/domains/guest-photos/domain/guest-photo-rules"

export type ResolvedGuestPhotoUploader =
  | { role: "guest"; identity: GuestWallIdentity }
  | { role: "photographer"; phone: string }

export interface GuestPhotoUploaderContext {
  guestRepository: Pick<GuestRepository, "findWallIdentity">
  /** Claves (últimos nueve dígitos) de WEDDING_PHOTOGRAPHER_PHONES. */
  photographerPhoneKeys: string[]
}

/**
 * Comprueba en el servidor lo que el navegador dice: que el invitado es de esta
 * boda o que el teléfono está en la lista de fotógrafos.
 */
export async function resolveGuestPhotoUploader(
  input: GuestPhotoUploaderContext & {
    weddingId: string
    claim: GuestPhotoUploaderClaim
  },
): Promise<ResolvedGuestPhotoUploader | null> {
  if (input.claim.role === "photographer") {
    const phoneKey = toPhoneKey(input.claim.phone)

    return phoneKey && input.photographerPhoneKeys.includes(phoneKey)
      ? { role: "photographer", phone: input.claim.phone.trim() }
      : null
  }

  const identity = await input.guestRepository.findWallIdentity(
    input.weddingId,
    input.claim.guestId,
  )

  return identity ? { role: "guest", identity } : null
}

/** Nombre que se guarda con la foto. Las de fotógrafo se nombran al mostrarse. */
export function guestPhotoCredit(
  uploader: ResolvedGuestPhotoUploader,
  choice: GuestPhotoCreditChoice,
  customCredit?: string | null,
): string | null {
  if (uploader.role === "photographer") {
    return null
  }

  // Un nombre escrito vacío firma solo con el nombre del invitado.
  if (choice === "custom") {
    return normalizeCustomCredit(customCredit) ?? uploader.identity.firstName
  }

  return choice === "party" && uploader.identity.partyName
    ? uploader.identity.partyName
    : uploader.identity.firstName
}
