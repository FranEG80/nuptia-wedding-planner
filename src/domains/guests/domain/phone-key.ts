const LOCAL_PHONE_DIGITS = 9

/**
 * Clave de comparación de un teléfono: sus últimos nueve dígitos. Así un número
 * guardado con "+34", con espacios o con guiones coincide igual.
 */
export function toPhoneKey(value: string): string | null {
  const digits = value.replace(/\D/g, "")

  return digits.length >= LOCAL_PHONE_DIGITS
    ? digits.slice(-LOCAL_PHONE_DIGITS)
    : null
}

/**
 * Lee una lista de teléfonos separada por comas (o punto y coma, o saltos de
 * línea) y devuelve sus claves. Las entradas sin nueve dígitos se descartan.
 */
export function parsePhoneList(raw: string | undefined): string[] {
  if (!raw) {
    return []
  }

  return raw
    .split(/[,;\n]/)
    .map((entry) => toPhoneKey(entry))
    .filter((key): key is string => key !== null)
}
