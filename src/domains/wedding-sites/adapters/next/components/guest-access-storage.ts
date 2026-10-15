import { useMemo, useSyncExternalStore } from "react"

/**
 * Identidad del invitado en el navegador. Es una comodidad, no una sesión: el
 * servidor vuelve a validar el guestId (o el teléfono del fotógrafo) en cada
 * subida, pero cualquiera puede escribir este valor a mano.
 */
const STORAGE_PREFIX = "nuptia:guest-access:"
const CHANGE_EVENT = "nuptia:guest-access-change"

export type StoredGuestAccess =
  | {
      role: "guest"
      guestId: string
      firstName: string
      /** Nombre y apellido, para firmar fotos y mensajes. */
      fullName: string
      /** Nombre de su invitación si incluye a más gente ("Ana y Juan"). */
      partyName: string | null
    }
  | { role: "photographer"; phone: string }

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`
}

export function readStoredGuestAccessRaw(slug: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(slug))
  } catch {
    // Almacenamiento bloqueado (navegación privada o datos del sitio borrados).
    return null
  }
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

export function parseStoredGuestAccess(raw: string | null): StoredGuestAccess | null {
  if (!raw) {
    return null
  }

  try {
    const value = JSON.parse(raw) as Record<string, unknown>

    if (value.role === "photographer") {
      // Sin teléfono no se puede validar en el servidor: hay que identificarse
      // otra vez (accesos guardados antes de que existiera la subida).
      const phone = optionalString(value.phone)
      return phone ? { role: "photographer", phone } : null
    }

    if (
      value.role !== "guest" ||
      typeof value.guestId !== "string" ||
      typeof value.firstName !== "string"
    ) {
      return null
    }

    return {
      role: "guest",
      guestId: value.guestId,
      firstName: value.firstName,
      fullName: optionalString(value.fullName) ?? value.firstName,
      partyName: optionalString(value.partyName),
    }
  } catch {
    return null
  }
}

export function saveStoredGuestAccess(slug: string, access: StoredGuestAccess) {
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(access))
  } catch {
    // Sin almacenamiento el acceso dura solo mientras la página siga abierta.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function clearStoredGuestAccess(slug: string) {
  try {
    window.localStorage.removeItem(storageKey(slug))
  } catch {
    // Nada que borrar si el almacenamiento no está disponible.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeToGuestAccess(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

/** Acceso guardado para esta boda; null en el servidor y sin identificar. */
export function useStoredGuestAccess(slug: string): StoredGuestAccess | null {
  const raw = useSyncExternalStore(
    subscribeToGuestAccess,
    () => readStoredGuestAccessRaw(slug),
    () => null,
  )

  return useMemo(() => parseStoredGuestAccess(raw), [raw])
}

/** Lo que el servidor necesita para validar a quien sube algo al muro. */
export type GuestWallUploaderClaim =
  | { role: "guest"; guestId: string }
  | { role: "photographer"; phone: string }

export function toGuestWallUploaderClaim(access: StoredGuestAccess): GuestWallUploaderClaim {
  return access.role === "guest"
    ? { role: "guest", guestId: access.guestId }
    : { role: "photographer", phone: access.phone }
}
