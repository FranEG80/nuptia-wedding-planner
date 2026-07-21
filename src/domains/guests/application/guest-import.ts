import {
  createInvitationPartySchema,
  type CreateInvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"

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

interface NormalizedRow {
  rowNumber: number
  groupLabel: string
  pairKey: string
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

    // Ojo al orden: "invitacion..." se comprueba antes que "grupo" porque
    // ambas columnas son independientes (etiqueta vs. clave de emparejamiento).
    if (key.startsWith("invitacion") || key.startsWith("pareja")) {
      fields.pairKey = value
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
    !row.firstName &&
    !row.lastName &&
    !row.email &&
    !row.phone &&
    row.isRecipientRaw === null
  )
}

export function parseGuestImportRows(
  rawRows: RawGuestImportRow[],
  options: { existingEmails?: Set<string> } = {},
): GuestImportParseResult {
  const existingEmails = options.existingEmails ?? new Set<string>()
  const rowResults: GuestImportRowResult[] = []
  const parties: CreateInvitationPartyDto[] = []

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

  // La clave de emparejamiento (pairKey) decide qué filas comparten invitación.
  // El grupo (groupLabel) es solo una etiqueta libre y nunca combina personas,
  // así que un mismo grupo puede tener tantas invitaciones sueltas como haga falta.
  const pairs = new Map<string, NormalizedRow[]>()
  let soloCounter = 0

  for (const row of normalizedRows) {
    const key = row.pairKey ? `pair:${row.pairKey.toLowerCase()}` : `solo:${soloCounter++}`
    const members = pairs.get(key) ?? []

    if (row.pairKey && members.length >= 2) {
      rowResults.push({
        rowNumber: row.rowNumber,
        status: "error",
        message: `La invitación conjunta "${row.pairKey}" ya tiene 2 personas; esta fila no se importa (máximo 2 por invitación).`,
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

    const parsed = createInvitationPartySchema.safeParse({ groupName, guests })
    const rowNumbers = members.map((member) => member.rowNumber)

    if (parsed.success) {
      parties.push(parsed.data)

      for (const member of members) {
        const isDuplicate = member.email && existingEmails.has(member.email.toLowerCase())
        const groupMismatch = groupLabels.size > 1

        rowResults.push({
          rowNumber: member.rowNumber,
          status: isDuplicate || groupMismatch ? "warning" : "ok",
          message: groupMismatch
            ? `Se importará con el grupo "${groupName}"; las dos personas de esta invitación tienen grupos distintos.`
            : isDuplicate
              ? `Se importará, pero el email ${member.email} ya existe en otra invitación.`
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
