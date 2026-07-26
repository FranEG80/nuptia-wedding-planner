import {
  createInvitationPartySchema,
  type CreateInvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import { normalizePhoneForWhatsapp } from "@/domains/guests/application/normalize-phone"
import { MAX_INVITATION_GUESTS } from "@/domains/guests/domain/invitation-party-limits"

export type RawGuestImportRow = Record<string, unknown>

export interface GuestImportRowResult {
  rowNumber: number
  status: "ok" | "error" | "warning" | "skipped"
  message: string
}

export interface GuestImportParseResult {
  parties: CreateInvitationPartyDto[]
  rows: GuestImportRowResult[]
}

export function normalizeGuestEmail(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

export function normalizeGuestPhone(
  value: string | null | undefined,
): string | null {
  return normalizePhoneForWhatsapp(value)
}

interface NormalizedRow {
  rowNumber: number
  groupLabel: string
  pairKey: string
  invitationName: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  isRecipientRaw: boolean | null
}

const RECIPIENT_TRUE_VALUES = new Set([
  "si",
  "s",
  "sí",
  "yes",
  "y",
  "true",
  "1",
  "x",
])
const RECIPIENT_FALSE_VALUES = new Set(["no", "n", "false", "0", ""])

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return String(value).trim()
}

function parseRecipientFlag(value: unknown): boolean | null {
  const text = toText(value).toLowerCase()

  if (text === "") {
    return null
  }

  if (RECIPIENT_TRUE_VALUES.has(text)) {
    return true
  }

  if (RECIPIENT_FALSE_VALUES.has(text)) {
    return false
  }

  return null
}

function normalizeRow(raw: RawGuestImportRow, rowNumber: number): NormalizedRow {
  const fields: Record<string, unknown> = {}

  for (const [header, value] of Object.entries(raw)) {
    const key = normalizeHeader(header)

    // El formato público conserva "Invitación conjunta" por compatibilidad con
    // los Excel existentes. Los formatos que separaban clave y nombre siguen
    // leyéndose para no romper archivos ya preparados durante la transición.
    if (
      key.startsWith("nombreinvitacion") ||
      key.startsWith("nombreconjunta")
    ) {
      fields.invitationName = value
    } else if (key.startsWith("claveinvitacion")) {
      fields.pairKey = value
    } else if (key.startsWith("invitacion") || key.startsWith("pareja")) {
      fields.invitationName = value
    } else if (key.startsWith("grupo")) {
      fields.groupLabel = value
    } else if (key.startsWith("nombre")) {
      fields.firstName = value
    } else if (key.startsWith("apellido")) {
      fields.lastName = value
    } else if (key.startsWith("telefono")) {
      fields.phone = value
    } else if (key.startsWith("email") || key.startsWith("correo")) {
      fields.email = value
    } else if (key.startsWith("destinatario") || key.startsWith("recibe")) {
      fields.isRecipientRaw = value
    }
  }

  const email = toText(fields.email)
  const phone = toText(fields.phone)

  return {
    rowNumber,
    groupLabel: toText(fields.groupLabel),
    pairKey: toText(fields.pairKey),
    invitationName: toText(fields.invitationName),
    firstName: toText(fields.firstName),
    lastName: toText(fields.lastName),
    email: email || null,
    phone: phone || null,
    isRecipientRaw: parseRecipientFlag(fields.isRecipientRaw),
  }
}

function isBlankRow(row: NormalizedRow): boolean {
  return (
    !row.groupLabel &&
    !row.pairKey &&
    !row.invitationName &&
    !row.firstName &&
    !row.lastName &&
    !row.email &&
    !row.phone &&
    row.isRecipientRaw === null
  )
}

export function parseGuestImportRows(
  rawRows: RawGuestImportRow[],
  options: { existingEmails?: Set<string>; existingPhones?: Set<string> } = {},
): GuestImportParseResult {
  const rowResults: GuestImportRowResult[] = []
  const parties: CreateInvitationPartyDto[] = []
  // Arranca con los emails ya existentes en BD y va acumulando los del propio
  // archivo, así detecta tanto duplicados contra invitaciones previas como
  // duplicados entre dos filas de esta misma importación.
  const seenEmails = new Set(
    Array.from(options.existingEmails ?? [])
      .map(normalizeGuestEmail)
      .filter((email): email is string => Boolean(email)),
  )
  const seenPhones = new Set(
    Array.from(options.existingPhones ?? [])
      .map(normalizeGuestPhone)
      .filter((phone): phone is string => Boolean(phone)),
  )

  const normalizedRows = rawRows
    // La fila 1 es la cabecera, así que los datos empiezan en la fila 2.
    .map((raw, index) => normalizeRow(raw, index + 2))
    .filter((row) => {
      if (isBlankRow(row)) {
        return false
      }

      if (!row.firstName) {
        rowResults.push({
          rowNumber: row.rowNumber,
          status: "error",
          message: "Falta el nombre del invitado.",
        })
        return false
      }

      return true
    })

  // Invitación conjunta decide qué filas comparten invitación. En el formato
  // actual el valor también es el nombre visible y la clave interna se deriva
  // automáticamente. El grupo (groupLabel) es solo una etiqueta libre y nunca
  // combina personas, así que un mismo grupo puede tener invitaciones sueltas.
  const pairs = new Map<string, NormalizedRow[]>()
  let soloCounter = 0

  for (const row of normalizedRows) {
    const groupingValue = row.pairKey || row.invitationName
    const key = groupingValue
      ? `pair:${groupingValue.toLowerCase()}`
      : `solo:${soloCounter++}`
    const members = pairs.get(key) ?? []

    if (groupingValue && members.length >= MAX_INVITATION_GUESTS) {
      rowResults.push({
        rowNumber: row.rowNumber,
        status: "error",
        message: `La invitación conjunta "${groupingValue}" ya tiene ${MAX_INVITATION_GUESTS} personas; esta fila no se importa (máximo ${MAX_INVITATION_GUESTS} por invitación).`,
      })
      continue
    }

    members.push(row)
    pairs.set(key, members)
  }

  for (const members of pairs.values()) {
    const hasExplicitRecipient = members.some((member) => member.isRecipientRaw === true)
    const guests = members.map((member) => {
      let isRecipient = member.isRecipientRaw === true

      if (!hasExplicitRecipient) {
        if (members.length === 1) {
          isRecipient = true
        } else {
          const firstWithContact = members.find((m) => m.email || m.phone)
          isRecipient = firstWithContact === member
        }
      }

      return {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        isRecipient,
      }
    })

    const groupLabels = new Set(
      members.map((member) => member.groupLabel).filter((label) => label),
    )
    const groupName = members[0].groupLabel
    const invitationNameForMember = (member: NormalizedRow) =>
      member.invitationName || member.pairKey
    const invitationNames = new Set(
      members.map(invitationNameForMember).filter((name) => name),
    )
    const invitationName = invitationNameForMember(members[0])

    const parsed = createInvitationPartySchema.safeParse({
      groupName,
      invitationName,
      guests,
    })
    const rowNumbers = members.map((member) => member.rowNumber)

    if (parsed.success) {
      parties.push(parsed.data)

      for (const member of members) {
        const emailKey = normalizeGuestEmail(member.email)
        const phoneKey = normalizeGuestPhone(member.phone)
        const duplicateEmail = emailKey !== null && seenEmails.has(emailKey)
        const duplicatePhone = phoneKey !== null && seenPhones.has(phoneKey)
        const isDuplicate = duplicateEmail || duplicatePhone
        const groupMismatch = groupLabels.size > 1
        const invitationNameMismatch = invitationNames.size > 1

        if (emailKey !== null) {
          seenEmails.add(emailKey)
        }
        if (phoneKey !== null) {
          seenPhones.add(phoneKey)
        }

        const duplicateContact = duplicateEmail
          ? `el email ${member.email}`
          : `el teléfono ${member.phone}`

        rowResults.push({
          rowNumber: member.rowNumber,
          status:
            isDuplicate || groupMismatch || invitationNameMismatch
              ? "warning"
              : "ok",
          message: groupMismatch
            ? `Se importará con el grupo "${groupName}"; el Grupo solo organiza el panel y las filas tienen grupos distintos.`
            : invitationNameMismatch
              ? `Se importará con el nombre conjunto "${invitationName}"; las filas tienen nombres de invitación distintos.`
            : isDuplicate
              ? `El contacto ${duplicateContact} ya existe; se omitirá la persona repetida o se añadirá su acompañante a la invitación existente.`
              : "Lista para importar.",
        })
      }

      continue
    }

    const message = parsed.error.issues.map((issue) => issue.message).join(" ")

    for (const rowNumber of rowNumbers) {
      rowResults.push({ rowNumber, status: "error", message })
    }
  }

  rowResults.sort((a, b) => a.rowNumber - b.rowNumber)

  return { parties, rows: rowResults }
}
