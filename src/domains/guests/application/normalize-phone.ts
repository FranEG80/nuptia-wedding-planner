export function normalizePhoneForWhatsapp(
  value: string | null | undefined,
): string | null {
  const digits = value?.replace(/\D/g, "") ?? ""
  const normalized = digits.replace(/^00/, "")

  if (!normalized) {
    return null
  }

  // A 9-digit number without a country code is assumed to be Spanish.
  return normalized.length === 9 ? `34${normalized}` : normalized
}
