/**
 * Tablón de firmas de la web de boda: mensajes públicos que dejan los
 * invitados identificados por teléfono. Se leen por páginas, de la firma más
 * reciente a la más antigua.
 */

export interface GuestbookSignature {
  id: string
  authorName: string
  message: string
  createdAt: string
}

/**
 * Las firmas se publican al momento. Los novios pueden ocultarlas desde su
 * panel: una firma oculta desaparece del tablón pero no se borra.
 */
export type GuestbookSignatureStatus = "published" | "hidden"

/** Firma tal y como la ven los novios al moderar: con su estado y quién firmó. */
export interface GuestbookModerationSignature extends GuestbookSignature {
  status: GuestbookSignatureStatus
  guestId: string
  guestName: string
}

export function isGuestbookSignatureStatus(value: string): value is GuestbookSignatureStatus {
  return value === "published" || value === "hidden"
}

export const GUESTBOOK_PAGE_SIZE = 12
export const GUESTBOOK_MESSAGE_MAX_LENGTH = 800
export const GUESTBOOK_AUTHOR_MAX_LENGTH = 60

/**
 * Limpia el texto de una firma: sin espacios en los extremos, sin caracteres de
 * control y como mucho una línea en blanco seguida, para que nadie deje medio
 * tablón vacío con saltos de línea.
 */
export function normalizeGuestbookMessage(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+\n/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Nombre de la firma en una sola línea y sin espacios repetidos. */
export function normalizeGuestbookAuthorName(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

export function guestbookPageCount(total: number, pageSize = GUESTBOOK_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

/** Página válida entre 1 y la última. Cualquier valor raro vuelve a la 1. */
export function clampGuestbookPage(page: number, pageCount: number): number {
  if (!Number.isFinite(page)) {
    return 1
  }

  return Math.min(Math.max(1, Math.trunc(page)), Math.max(1, pageCount))
}

export type GuestbookPaginationItem = number | "gap"

/**
 * Números que enseña la paginación: siempre la primera y la última, la actual
 * con sus vecinas, y un hueco donde se saltan páginas. Un hueco de una sola
 * página se rellena con el número: "…" ocuparía lo mismo y diría menos.
 */
export function guestbookPaginationItems(
  page: number,
  pageCount: number,
): GuestbookPaginationItem[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  const visible = [...pages]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b)
  const items: GuestbookPaginationItem[] = []

  for (const value of visible) {
    const previous = items.at(-1)

    if (typeof previous === "number" && value - previous === 2) {
      items.push(previous + 1)
    } else if (typeof previous === "number" && value - previous > 2) {
      items.push("gap")
    }

    items.push(value)
  }

  return items
}
