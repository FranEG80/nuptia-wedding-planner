/**
 * La web de boda se abre entera el día señalado. Antes de esa fecha solo se
 * publica la portada con la cuenta atrás.
 */

/**
 * Las bodas de la plataforma se celebran en España y `dateIso` puede llegar con
 * el desfase horario de la ceremonia o con el que guarde la base de datos, así
 * que el corte se calcula siempre sobre el día natural en Madrid.
 */
const WEDDING_TIME_ZONE = "Europe/Madrid"

/** `en-CA` formatea como `YYYY-MM-DD`, que se puede comparar como texto. */
const weddingDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: WEDDING_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function toWeddingDay(dateIso: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(dateIso.trim())

  return match ? match[1] : null
}

/**
 * `true` desde las 00:00 del día de la boda (hora de Madrid). Una fecha
 * ilegible devuelve `true`: preferimos publicar de más antes que dejar una web
 * bloqueada para siempre.
 */
export function isWeddingDayReached(dateIso: string, now: Date = new Date()): boolean {
  const weddingDay = toWeddingDay(dateIso)

  if (!weddingDay) {
    return true
  }

  return weddingDayFormatter.format(now) >= weddingDay
}

export function isFullWeddingSiteVisible({
  dateIso,
  alwaysEnabled = false,
  preview = false,
  now,
}: {
  dateIso: string
  /** `WEDDING_SITE_ENABLED`: abre la web completa para desarrollar en local. */
  alwaysEnabled?: boolean
  /** El editor privado siempre necesita ver la web entera. */
  preview?: boolean
  now?: Date
}): boolean {
  return alwaysEnabled || preview || isWeddingDayReached(dateIso, now)
}
