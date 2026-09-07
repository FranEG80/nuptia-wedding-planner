import type { InvitationContent } from "@/domains/invitations/domain/invitation-design"

const LOCAL_PHONE_DIGITS = 9

function toPhoneKey(value: string): string | null {
  const digits = value.replace(/\D/g, "")

  return digits.length >= LOCAL_PHONE_DIGITS
    ? digits.slice(-LOCAL_PHONE_DIGITS)
    : null
}

/**
 * Reads the comma (or whitespace) separated phone list used to opt specific
 * invitations out of the registry section. Numbers are compared by their last
 * nine digits so stored prefixes such as `+34` or spacing do not matter.
 */
export function parseRegistryHiddenPhones(raw: string | undefined): string[] {
  if (!raw) {
    return []
  }

  return raw
    .split(/[,;\n]/)
    .map((entry) => toPhoneKey(entry))
    .filter((key): key is string => key !== null)
}

export function isRegistryHiddenForGuests(
  guestPhones: Array<string | null | undefined>,
  hiddenPhones: string[],
): boolean {
  if (hiddenPhones.length === 0) {
    return false
  }

  return guestPhones.some((phone) => {
    const key = phone ? toPhoneKey(phone) : null

    return key !== null && hiddenPhones.includes(key)
  })
}

export function withRegistryHidden<Content extends InvitationContent>(
  content: Content,
): Content {
  return {
    ...content,
    visibleSections: {
      ...content.visibleSections,
      registry: false,
    },
  }
}
