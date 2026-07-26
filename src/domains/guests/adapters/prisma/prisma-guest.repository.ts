import type { Prisma, PrismaClient } from "@generated/prisma/client"
import type {
  D1BatchDatabase,
  D1BatchStatement,
} from "@/core/db/d1-batch"
import type {
  CreateGuestInput,
  CreateInvitationPartyInput,
  GuestInviteParty,
  GuestRsvpSummary,
  GuestRepository,
  InvitationPartyGuestInput,
  PublicGuestInviteParty,
  RespondToPartyGuestInput,
  UpdateInvitationPartyInput,
  UpdateGuestInput,
} from "@/domains/guests/domain/ports/guest.repository"
import type {
  Guest,
  GuestInviteStatus,
  GuestRole,
  GuestRsvpStatus,
} from "@/domains/guests/domain/guest"
import { assertExactPartyResponses } from "@/domains/guests/domain/invitation-party-rules"
import { MAX_INVITATION_GUESTS } from "@/domains/guests/domain/invitation-party-limits"

const guestInclude = {
  party: true,
  seat: {
    include: {
      table: true,
    },
  },
  invitedBy: {
    include: {
      weddingMember: {
        include: {
          role: true,
        },
      },
    },
  },
  menuSelections: true,
  messages: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
} as const satisfies Prisma.GuestInclude

const partyInclude = {
  guests: {
    include: guestInclude,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
} as const satisfies Prisma.GuestPartyInclude

// D1 enforces a low bound-parameter limit for SQLite statements. Prisma
// expands relation includes into additional IN clauses, so a seemingly small
// root query can exceed that limit once all guest relations are hydrated.
const D1_READ_BATCH_SIZE = 25
const D1_PARTY_READ_BATCH_SIZE = 10
const guestListOrderBy = [
  { party: { groupName: "asc" } },
  { name: "asc" },
  { id: "asc" },
] as const satisfies Prisma.GuestOrderByWithRelationInput[]
const partyListOrderBy = [
  { groupName: "asc" },
  { createdAt: "asc" },
  { id: "asc" },
] as const satisfies Prisma.GuestPartyOrderByWithRelationInput[]

const publicPartySelect = {
  id: true,
  weddingId: true,
  inviteToken: true,
  groupName: true,
  invitationName: true,
  inviteStatus: true,
  guests: {
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      phone: true,
      notes: true,
      rsvpStatus: true,
      menuSelections: {
        select: {
          menuDishId: true,
          dishOptionId: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
} as const satisfies Prisma.GuestPartySelect

type PrismaGuestRecord = NonNullable<
  Awaited<ReturnType<PrismaGuestRepository["findRecordById"]>>
>

type PrismaGuestPartyRecord = Prisma.GuestPartyGetPayload<{
  include: typeof partyInclude
}>

const inviteFromDb: Record<string, GuestInviteStatus> = {
  sent: "Enviada",
  pending: "Pendiente",
}

const inviteToDb: Record<GuestInviteStatus, string> = {
  Enviada: "sent",
  Pendiente: "pending",
}

const rsvpFromDb: Record<string, GuestRsvpStatus> = {
  confirmed: "Confirmado",
  declined: "Declinado",
  no_response: "Sin respuesta",
}

const rsvpToDb: Record<GuestRsvpStatus, string> = {
  Confirmado: "confirmed",
  Declinado: "declined",
  "Sin respuesta": "no_response",
}

function roleFromDb(value: string): GuestRole {
  return value === "companion" ? "companion" : "primary"
}

function toGuest(record: PrismaGuestRecord): Guest {
  return {
    id: record.id,
    partyId: record.partyId,
    weddingId: record.weddingId,
    appUserId: record.appUserId,
    role: roleFromDb(record.role),
    name: record.name,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    phone: record.phone,
    rsvp: rsvpFromDb[record.rsvpStatus] ?? "Sin respuesta",
    notes: record.notes ?? "",
    uploadToken: record.uploadToken,
    party: {
      id: record.party.id,
      weddingId: record.party.weddingId,
      inviteToken: record.party.inviteToken,
      groupName: record.party.groupName ?? "",
      invitationName: record.party.invitationName ?? "",
      invite: inviteFromDb[record.party.inviteStatus] ?? "Pendiente",
    },
    seat: record.seat
      ? {
          id: record.seat.id,
          tableId: record.seat.tableId,
          tableName: record.seat.table.name,
          position: record.seat.position,
        }
      : null,
    invitedBy: record.invitedBy.map((item) => ({
      weddingMemberId: item.weddingMemberId,
      displayName:
        item.weddingMember.displayName ?? item.weddingMember.role.label,
      roleCode: item.weddingMember.role.code,
    })),
    menuSelections: record.menuSelections.map((selection) => ({
      menuDishId: selection.menuDishId,
      dishOptionId: selection.dishOptionId,
    })),
    messages: record.messages.map((message) => ({
      id: message.id,
      weddingId: message.weddingId,
      guestId: message.guestId,
      message: message.message,
      status: message.status,
      createdAt: message.createdAt.toISOString(),
    })),
  }
}

function toGuestParty(record: PrismaGuestPartyRecord): GuestInviteParty {
  const guests = record.guests.map(toGuest)

  return {
    id: record.id,
    weddingId: record.weddingId,
    inviteToken: record.inviteToken,
    groupName: record.groupName ?? "",
    invitationName: record.invitationName ?? "",
    invite: inviteFromDb[record.inviteStatus] ?? "Pendiente",
    guests,
    messages: guests.flatMap((guest) => guest.messages),
  }
}

type PrismaPublicGuestPartyRecord = Prisma.GuestPartyGetPayload<{
  select: typeof publicPartySelect
}>

function toPublicGuestParty(
  record: PrismaPublicGuestPartyRecord,
): PublicGuestInviteParty {
  return {
    id: record.id,
    weddingId: record.weddingId,
    inviteToken: record.inviteToken,
    groupName: record.groupName ?? "",
    invitationName: record.invitationName ?? "",
    invite: inviteFromDb[record.inviteStatus] ?? "Pendiente",
    guests: record.guests.map((guest) => ({
      id: guest.id,
      role: roleFromDb(guest.role),
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      notes: guest.notes ?? "",
      rsvp: rsvpFromDb[guest.rsvpStatus] ?? "Sin respuesta",
      menuSelections: guest.menuSelections,
    })),
  }
}

function normalizeContact(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function composeFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ")
}

function assertValidPartyMembers(guests: InvitationPartyGuestInput[]) {
  if (guests.length < 1 || guests.length > MAX_INVITATION_GUESTS) {
    throw new Error(
      `Una invitación debe contener entre 1 y ${MAX_INVITATION_GUESTS} invitados`,
    )
  }

  const recipients = guests.filter((guest) => guest.isRecipient)

  if (recipients.length !== 1) {
    throw new Error("Una invitación debe tener exactamente un destinatario")
  }

  const recipient = recipients[0]

  if (!normalizeContact(recipient.email) && !normalizeContact(recipient.phone)) {
    throw new Error("El destinatario debe tener teléfono o email")
  }

  const ids = guests.flatMap((guest) => (guest.id ? [guest.id] : []))

  if (new Set(ids).size !== ids.length) {
    throw new Error("Una invitación no puede repetir al mismo invitado")
  }
}

export class PrismaGuestRepository implements GuestRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly d1: D1BatchDatabase,
  ) {}

  async findRecordById(id: string) {
    return this.prisma.guest.findUnique({
      where: { id },
      include: guestInclude,
    })
  }

  async listByWeddingId(weddingId: string): Promise<Guest[]> {
    const startedAt = Date.now()
    const guests: PrismaGuestRecord[] = []
    let offset = 0
    let batchIndex = 0

    console.info(
      "[nuptia:guests]",
      JSON.stringify({
        event: "listByWeddingId:start",
        batchSize: D1_READ_BATCH_SIZE,
      }),
    )

    while (true) {
      const page = await this.prisma.guest.findMany({
        where: { weddingId },
        select: { id: true },
        orderBy: guestListOrderBy,
        skip: offset,
        take: D1_READ_BATCH_SIZE,
      })

      if (page.length === 0) {
        break
      }

      const pageGuests = await this.prisma.guest.findMany({
        where: {
          weddingId,
          id: { in: page.map((guest) => guest.id) },
        },
        include: guestInclude,
      })
      const guestById = new Map(pageGuests.map((guest) => [guest.id, guest]))

      for (const { id } of page) {
        const guest = guestById.get(id)

        if (!guest) {
          throw new Error("No se pudo hidratar uno de los invitados")
        }

        guests.push(guest)
      }

      console.info(
        "[nuptia:guests]",
        JSON.stringify({
          event: "listByWeddingId:batch",
          batchIndex,
          batchCount: page.length,
        }),
      )

      batchIndex += 1
      offset += page.length

      if (page.length < D1_READ_BATCH_SIZE) {
        break
      }
    }

    console.info(
      "[nuptia:guests]",
      JSON.stringify({
        event: "listByWeddingId:complete",
        guestCount: guests.length,
        batchCount: batchIndex,
        durationMs: Date.now() - startedAt,
      }),
    )

    return guests.map(toGuest)
  }

  async getRsvpSummaryByWeddingId(
    weddingId: string,
  ): Promise<GuestRsvpSummary> {
    const startedAt = Date.now()
    const [result] = await this.d1.batch([
      this.d1
        .prepare(
          `SELECT rsvpStatus AS status, COUNT(*) AS count
           FROM guests
           WHERE weddingId = ?
           GROUP BY rsvpStatus`,
        )
        .bind(weddingId),
    ])
    const summary: GuestRsvpSummary = {
      confirmed: 0,
      pending: 0,
      declined: 0,
      total: 0,
    }

    for (const row of result?.results ?? []) {
      const count = Number(row.count)
      summary.total += Number.isFinite(count) ? count : 0

      if (row.status === "confirmed") {
        summary.confirmed = count
      } else if (row.status === "no_response") {
        summary.pending = count
      } else if (row.status === "declined") {
        summary.declined = count
      }
    }

    console.info(
      "[nuptia:guests]",
      JSON.stringify({
        event: "getRsvpSummaryByWeddingId:complete",
        ...summary,
        durationMs: Date.now() - startedAt,
      }),
    )

    return summary
  }

  async listPartiesByWeddingId(
    weddingId: string,
  ): Promise<GuestInviteParty[]> {
    const parties: PrismaGuestPartyRecord[] = []
    let offset = 0

    while (true) {
      const page = await this.prisma.guestParty.findMany({
        where: { weddingId },
        select: { id: true },
        orderBy: partyListOrderBy,
        skip: offset,
        take: D1_PARTY_READ_BATCH_SIZE,
      })

      if (page.length === 0) {
        break
      }

      const pageParties = await this.prisma.guestParty.findMany({
        where: {
          weddingId,
          id: { in: page.map((party) => party.id) },
        },
        include: partyInclude,
      })
      const partyById = new Map(pageParties.map((party) => [party.id, party]))

      for (const { id } of page) {
        const party = partyById.get(id)

        if (!party) {
          throw new Error("No se pudo hidratar una de las invitaciones")
        }

        parties.push(party)
      }

      offset += page.length

      if (page.length < D1_PARTY_READ_BATCH_SIZE) {
        break
      }
    }

    return parties.map(toGuestParty)
  }

  async findPartyByInviteToken(
    inviteToken: string,
  ): Promise<GuestInviteParty | null> {
    const party = await this.prisma.guestParty.findUnique({
      where: { inviteToken },
      include: partyInclude,
    })

    if (!party) {
      return null
    }

    return toGuestParty(party)
  }

  async findPublicPartyByInviteToken(
    inviteToken: string,
  ): Promise<PublicGuestInviteParty | null> {
    const party = await this.prisma.guestParty.findUnique({
      where: { inviteToken },
      select: publicPartySelect,
    })

    return party ? toPublicGuestParty(party) : null
  }

  async findById(id: string): Promise<Guest | null> {
    const guest = await this.findRecordById(id)

    return guest ? toGuest(guest) : null
  }

  async create(input: CreateGuestInput): Promise<Guest> {
    const inviteStatus = input.invite ? inviteToDb[input.invite] : "pending"
    const partyId =
      input.partyId ??
      (
        await this.prisma.guestParty.create({
          data: {
            weddingId: input.weddingId,
            groupName: input.groupName,
            invitationName: input.invitationName,
            inviteStatus,
          },
        })
      ).id

    const firstName = input.firstName.trim()
    const lastName = input.lastName?.trim() ?? ""
    const guest = await this.prisma.guest.create({
      data: {
        partyId,
        weddingId: input.weddingId,
        role: input.role ?? "primary",
        name: composeFullName(firstName, lastName),
        firstName,
        lastName,
        email: input.email,
        phone: input.phone,
        rsvpStatus: input.rsvp ? rsvpToDb[input.rsvp] : "no_response",
        notes: input.notes,
        uploadToken: input.uploadToken,
      },
      include: guestInclude,
    })

    return toGuest(guest)
  }

  async update(id: string, input: UpdateGuestInput): Promise<Guest | null> {
    const current = await this.prisma.guest.findUnique({
      where: { id },
      include: { party: true },
    })

    if (!current) {
      return null
    }

    const firstName = input.firstName?.trim() ?? current.firstName
    const lastName = input.lastName?.trim() ?? current.lastName

    await this.prisma.$transaction(async (tx) => {
      await tx.guest.update({
        where: { id },
        data: {
          role: input.role,
          name: composeFullName(firstName, lastName),
          firstName,
          lastName,
          email: input.email,
          phone: input.phone,
          rsvpStatus: input.rsvp ? rsvpToDb[input.rsvp] : undefined,
          notes: input.notes,
          uploadToken: input.uploadToken,
        },
      })

      if (
        input.groupName !== undefined ||
        input.invitationName !== undefined ||
        input.invite !== undefined
      ) {
        await tx.guestParty.update({
          where: { id: current.partyId },
          data: {
            groupName: input.groupName,
            invitationName: input.invitationName,
            inviteStatus: input.invite ? inviteToDb[input.invite] : undefined,
          },
        })
      }
    })

    const guest = await this.findRecordById(id)
    return guest ? toGuest(guest) : null
  }

  async createInvitationParty(
    input: CreateInvitationPartyInput,
  ): Promise<GuestInviteParty> {
    assertValidPartyMembers(input.guests)

    if (input.guests.some((guest) => guest.id)) {
      throw new Error("Los invitados nuevos no pueden tener un ID previo")
    }

    const partyId = crypto.randomUUID()
    const inviteToken = crypto.randomUUID()
    const now = new Date().toISOString()
    const statements: D1BatchStatement[] = [
      this.d1
        .prepare(
          `INSERT INTO guest_parties
            (id, weddingId, inviteToken, groupName, invitationName, inviteStatus, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
        )
        .bind(
          partyId,
          input.weddingId,
          inviteToken,
          input.groupName?.trim() || null,
          input.invitationName?.trim() || null,
          now,
          now,
        ),
    ]

    for (const [index, guest] of input.guests.entries()) {
      const createdAt = new Date(Date.now() + index).toISOString()
      const firstName = guest.firstName.trim()
      const lastName = guest.lastName?.trim() ?? ""

      statements.push(
        this.d1
          .prepare(
            `INSERT INTO guests
              (id, partyId, weddingId, role, name, firstName, lastName, email, phone, rsvpStatus,
               notes, uploadToken, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'no_response', '', ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            partyId,
            input.weddingId,
            guest.isRecipient ? "primary" : "companion",
            composeFullName(firstName, lastName),
            firstName,
            lastName,
            normalizeContact(guest.email),
            normalizeContact(guest.phone),
            crypto.randomUUID(),
            createdAt,
            now,
          ),
      )
    }

    await this.d1.batch(statements)

    const party = await this.prisma.guestParty.findUnique({
      where: { inviteToken },
      include: partyInclude,
    })

    if (!party) {
      throw new Error("No se pudo recuperar la invitación recién creada")
    }

    return toGuestParty(party)
  }

  async updateInvitationParty(
    partyId: string,
    input: UpdateInvitationPartyInput,
  ): Promise<GuestInviteParty | null> {
    assertValidPartyMembers(input.guests)

    const current = await this.prisma.guestParty.findFirst({
      where: { id: partyId, weddingId: input.weddingId },
      include: partyInclude,
    })

    if (!current) {
      return null
    }

    const currentGuestIds = new Set(current.guests.map((guest) => guest.id))
    const submittedIds = new Set(
      input.guests.flatMap((guest) => (guest.id ? [guest.id] : [])),
    )

    if (
      input.guests.some(
        (guest) => guest.id && !currentGuestIds.has(guest.id),
      )
    ) {
      throw new Error("Uno de los invitados no pertenece a esta invitación")
    }

    const compositionLocked =
      current.inviteStatus === "sent" ||
      current.guests.some((guest) =>
        ["confirmed", "declined"].includes(guest.rsvpStatus),
      )

    if (
      compositionLocked &&
      (submittedIds.size !== currentGuestIds.size ||
        input.guests.some((guest) => !guest.id) ||
        [...currentGuestIds].some((id) => !submittedIds.has(id)))
    ) {
      throw new Error(
        "No se puede cambiar la composición de una invitación enviada o respondida",
      )
    }

    const now = new Date().toISOString()
    const statements: D1BatchStatement[] = [
      this.d1
        .prepare(
          `UPDATE guest_parties
           SET groupName = ?, invitationName = ?, updatedAt = ?
           WHERE id = ? AND weddingId = ?`,
        )
        .bind(
          input.groupName?.trim() || null,
          input.invitationName?.trim() || null,
          now,
          partyId,
          input.weddingId,
        ),
    ]

    for (const guest of current.guests) {
      if (!submittedIds.has(guest.id)) {
        statements.push(
          this.d1
            .prepare(
              "DELETE FROM guests WHERE id = ? AND partyId = ? AND weddingId = ?",
            )
            .bind(guest.id, partyId, input.weddingId),
        )
      }
    }

    // Demote first so changing the recipient cannot transiently violate the
    // partial unique index that allows only one primary per invitation.
    statements.push(
      this.d1
        .prepare(
          "UPDATE guests SET role = 'companion', updatedAt = ? WHERE partyId = ?",
        )
        .bind(now, partyId),
    )

    for (const guest of input.guests) {
      const role = guest.isRecipient ? "primary" : "companion"
      const firstName = guest.firstName.trim()
      const lastName = guest.lastName?.trim() ?? ""

      if (guest.id) {
        statements.push(
          this.d1
            .prepare(
              `UPDATE guests
               SET role = ?, name = ?, firstName = ?, lastName = ?, email = ?, phone = ?, updatedAt = ?
               WHERE id = ? AND partyId = ? AND weddingId = ?`,
            )
            .bind(
              role,
              composeFullName(firstName, lastName),
              firstName,
              lastName,
              normalizeContact(guest.email),
              normalizeContact(guest.phone),
              now,
              guest.id,
              partyId,
              input.weddingId,
            ),
        )
        continue
      }

      statements.push(
        this.d1
          .prepare(
            `INSERT INTO guests
              (id, partyId, weddingId, role, name, firstName, lastName, email, phone, rsvpStatus,
               notes, uploadToken, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'no_response', '', ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            partyId,
            input.weddingId,
            role,
            composeFullName(firstName, lastName),
            firstName,
            lastName,
            normalizeContact(guest.email),
            normalizeContact(guest.phone),
            crypto.randomUUID(),
            now,
            now,
          ),
      )
    }

    await this.d1.batch(statements)

    const updated = await this.prisma.guestParty.findFirst({
      where: { id: partyId, weddingId: input.weddingId },
      include: partyInclude,
    })

    return updated ? toGuestParty(updated) : null
  }

  async linkInvitationParty(
    targetPartyId: string,
    sourcePartyId: string,
    weddingId: string,
  ): Promise<GuestInviteParty | null> {
    if (targetPartyId === sourcePartyId) {
      throw new Error("No se puede vincular una invitación consigo misma")
    }

    const [target, source] = await Promise.all([
      this.prisma.guestParty.findFirst({
        where: { id: targetPartyId, weddingId },
        include: partyInclude,
      }),
      this.prisma.guestParty.findFirst({
        where: { id: sourcePartyId, weddingId },
        include: partyInclude,
      }),
    ])

    if (!target || !source) {
      return null
    }

    if (source.guests.length !== 1) {
      throw new Error("Solo se puede vincular una invitación individual")
    }

    if (target.guests.length + source.guests.length > MAX_INVITATION_GUESTS) {
      throw new Error(
        `La invitación no puede superar ${MAX_INVITATION_GUESTS} personas`,
      )
    }

    const isLocked = (party: typeof target) =>
      party.inviteStatus === "sent" ||
      party.guests.some((guest) =>
        ["confirmed", "declined"].includes(guest.rsvpStatus),
      )

    if (isLocked(target) || isLocked(source)) {
      throw new Error(
        "No se pueden vincular invitaciones enviadas o respondidas",
      )
    }

    const sourceGuest = source.guests[0]
    const now = new Date().toISOString()

    await this.d1.batch([
      this.d1
        .prepare(
          "UPDATE guests SET partyId = ?, role = 'companion', updatedAt = ? WHERE id = ? AND partyId = ? AND weddingId = ?",
        )
        .bind(targetPartyId, now, sourceGuest.id, sourcePartyId, weddingId),
      this.d1
        .prepare("DELETE FROM guest_parties WHERE id = ? AND weddingId = ?")
        .bind(sourcePartyId, weddingId),
    ])

    const updated = await this.prisma.guestParty.findFirst({
      where: { id: targetPartyId, weddingId },
      include: partyInclude,
    })

    return updated ? toGuestParty(updated) : null
  }

  async markPartiesInvited(
    weddingId: string,
    partyIds: string[],
  ): Promise<Guest[]> {
    await this.prisma.guestParty.updateMany({
      where: { weddingId, id: { in: partyIds } },
      data: { inviteStatus: "sent" },
    })

    return this.listByWeddingId(weddingId)
  }

  async respondToParty(
    inviteToken: string,
    rsvp: Guest["rsvp"],
  ): Promise<GuestInviteParty | null> {
    const party = await this.prisma.guestParty.findUnique({
      where: { inviteToken },
      select: { id: true },
    })

    if (!party) {
      return null
    }

    await this.prisma.guest.updateMany({
      where: { partyId: party.id },
      data: { rsvpStatus: rsvpToDb[rsvp] },
    })

    return this.findPartyByInviteToken(inviteToken)
  }

  async respondToPartyWithDetails(
    inviteToken: string,
    input: {
      guests: RespondToPartyGuestInput[]
      message?: string | null
    },
  ): Promise<GuestInviteParty | null> {
    const traceId = crypto.randomUUID()

    console.info(
      "[nuptia:rsvp]",
      JSON.stringify({
        event: "respond-repository:start",
        traceId,
        guestCount: input.guests.length,
        attendingCount: input.guests.filter((guest) => guest.attending).length,
        selectionCount: input.guests.reduce(
          (count, guest) => count + (guest.menuSelections?.length ?? 0),
          0,
        ),
        hasMessage: Boolean(input.message?.trim()),
      }),
    )

    const party = await this.prisma.guestParty.findUnique({
      where: { inviteToken },
      select: {
        id: true,
        weddingId: true,
        guests: {
          select: {
            id: true,
            role: true,
            email: true,
            phone: true,
            notes: true,
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        },
      },
    })

    console.info(
      "[nuptia:rsvp]",
      JSON.stringify({
        event: "respond-repository:party-loaded",
        traceId,
        partyFound: Boolean(party),
        guestCount: party?.guests.length ?? 0,
      }),
    )

    if (!party) {
      return null
    }

    if (party.guests.length < 1 || party.guests.length > MAX_INVITATION_GUESTS) {
      throw new Error(
        `La invitación no contiene entre 1 y ${MAX_INVITATION_GUESTS} invitados válidos`,
      )
    }

    const submittedIds = input.guests.map((guest) => guest.guestId)
    assertExactPartyResponses(
      party.guests.map((guest) => guest.id),
      submittedIds,
    )

    for (const response of input.guests) {
      const menuDishIds = (response.menuSelections ?? []).map(
        (selection) => selection.menuDishId,
      )

      if (new Set(menuDishIds).size !== menuDishIds.length) {
        throw new Error("No se puede elegir dos opciones para el mismo plato")
      }
    }

    const requestedSelections = input.guests
      .filter((guest) => guest.attending)
      .flatMap((guest) => guest.menuSelections ?? [])
    const requestedMenuDishIds = [
      ...new Set(requestedSelections.map((selection) => selection.menuDishId)),
    ]
    const menuDishes = requestedMenuDishIds.length
      ? await this.prisma.restaurantMenuDish.findMany({
          where: {
            id: { in: requestedMenuDishIds },
            menu: { weddings: { some: { id: party.weddingId } } },
          },
          select: {
            id: true,
            dish: { select: { options: { select: { id: true } } } },
          },
        })
      : []
    const validMenuPairs = new Set(
      menuDishes.flatMap((menuDish) =>
        menuDish.dish.options.map(
          (option) => `${menuDish.id}:${option.id}`,
        ),
      ),
    )

    if (
      requestedSelections.some(
        (selection) =>
          !validMenuPairs.has(
            `${selection.menuDishId}:${selection.dishOptionId}`,
          ),
      )
    ) {
      throw new Error("La selección de menú no pertenece a esta boda")
    }

    console.info(
      "[nuptia:rsvp]",
      JSON.stringify({
        event: "respond-repository:input-validated",
        traceId,
        requestedSelectionCount: requestedSelections.length,
        menuDishCount: menuDishes.length,
      }),
    )

    const responsesByGuestId = new Map(
      input.guests.map((guest) => [guest.guestId, guest]),
    )
    const now = new Date().toISOString()
    const statements: D1BatchStatement[] = []

    for (const guest of party.guests) {
      const response = responsesByGuestId.get(guest.id)

      if (!response) {
        throw new Error("Falta la respuesta de uno de los invitados")
      }

      const notes = response.attending
        ? response.notes === undefined
          ? guest.notes ?? ""
          : response.notes.trim()
        : ""

      statements.push(
        this.d1
          .prepare(
            `UPDATE guests
             SET email = ?, phone = ?, notes = ?, rsvpStatus = ?, updatedAt = ?
             WHERE id = ? AND partyId = ?`,
          )
          .bind(
            response.email === undefined
              ? guest.email
              : normalizeContact(response.email),
            response.phone === undefined
              ? guest.phone
              : normalizeContact(response.phone),
            notes,
            response.attending ? "confirmed" : "declined",
            now,
            guest.id,
            party.id,
          ),
        this.d1
          .prepare("DELETE FROM guest_menu_selections WHERE guestId = ?")
          .bind(guest.id),
      )

      if (!response.attending) {
        continue
      }

      for (const selection of response.menuSelections ?? []) {
        statements.push(
          this.d1
            .prepare(
              `INSERT INTO guest_menu_selections
                (id, guestId, menuDishId, dishOptionId)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(
              crypto.randomUUID(),
              guest.id,
              selection.menuDishId,
              selection.dishOptionId,
            ),
        )
      }
    }

    const recipient = party.guests.find((guest) => guest.role === "primary")

    if (!recipient) {
      throw new Error("La invitación no tiene un destinatario configurado")
    }

    const message = input.message?.trim()

    if (message) {
      statements.push(
        this.d1
          .prepare(
            `INSERT INTO guest_messages
              (id, weddingId, guestId, message, status, createdAt)
             VALUES (?, ?, ?, ?, 'pending', ?)`,
          )
          .bind(
            crypto.randomUUID(),
            party.weddingId,
            recipient.id,
            message,
            now,
          ),
      )
    }

    console.info(
      "[nuptia:rsvp]",
      JSON.stringify({
        event: "respond-repository:batch-start",
        traceId,
        statementCount: statements.length,
      }),
    )

    await this.d1.batch(statements)

    console.info(
      "[nuptia:rsvp]",
      JSON.stringify({
        event: "respond-repository:batch-complete",
        traceId,
        statementCount: statements.length,
      }),
    )

    const result = await this.findPartyByInviteToken(inviteToken)

    console.info(
      "[nuptia:rsvp]",
      JSON.stringify({
        event: "respond-repository:complete",
        traceId,
        partyFound: Boolean(result),
        guestCount: result?.guests.length ?? 0,
      }),
    )

    return result
  }

  async assignSeat(
    guestId: string,
    weddingId: string,
    tableId: string,
  ): Promise<Guest | null> {
    const [guestRecord, table, currentSeat] = await Promise.all([
      this.prisma.guest.findFirst({
        where: { id: guestId, weddingId },
        select: { id: true },
      }),
      this.prisma.weddingTable.findFirst({
        where: { id: tableId, weddingId },
        select: { id: true, name: true, capacity: true },
      }),
      this.prisma.weddingSeat.findUnique({
        where: { guestId },
        select: { tableId: true },
      }),
    ])

    if (!guestRecord || !table) {
      return null
    }

    if (table.capacity !== null && currentSeat?.tableId !== tableId) {
      const occupied = await this.prisma.weddingSeat.count({
        where: { tableId },
      })

      if (occupied >= table.capacity) {
        throw new Error(`La mesa "${table.name}" está llena.`)
      }
    }

    const now = new Date().toISOString()

    await this.d1.batch([
      this.d1.prepare("DELETE FROM wedding_seats WHERE guestId = ?").bind(guestId),
      this.d1
        .prepare(
          `INSERT INTO wedding_seats (id, tableId, position, guestId, createdAt, updatedAt)
           VALUES (?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM wedding_seats WHERE tableId = ?), ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), tableId, tableId, guestId, now, now),
    ])

    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, weddingId },
      include: guestInclude,
    })

    return guest ? toGuest(guest) : null
  }

  async unassignSeat(guestId: string, weddingId: string): Promise<Guest | null> {
    await this.d1.batch([
      this.d1
        .prepare(
          `DELETE FROM wedding_seats
           WHERE guestId = (SELECT id FROM guests WHERE id = ? AND weddingId = ?)`,
        )
        .bind(guestId, weddingId),
    ])

    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, weddingId },
      include: guestInclude,
    })

    return guest ? toGuest(guest) : null
  }

  async deleteInvitationParty(
    partyId: string,
    weddingId: string,
  ): Promise<boolean> {
    const party = await this.prisma.guestParty.findFirst({
      where: { id: partyId, weddingId },
      select: { id: true },
    })

    if (!party) {
      return false
    }

    const guestScope =
      "(SELECT id FROM guests WHERE partyId = ? AND weddingId = ?)"

    await this.d1.batch([
      this.d1
        .prepare(`DELETE FROM guest_invited_by WHERE guestId IN ${guestScope}`)
        .bind(partyId, weddingId),
      this.d1
        .prepare(
          `DELETE FROM guest_menu_selections WHERE guestId IN ${guestScope}`,
        )
        .bind(partyId, weddingId),
      this.d1
        .prepare(`DELETE FROM guest_messages WHERE guestId IN ${guestScope}`)
        .bind(partyId, weddingId),
      this.d1
        .prepare(`DELETE FROM guest_photos WHERE guestId IN ${guestScope}`)
        .bind(partyId, weddingId),
      this.d1
        .prepare(`DELETE FROM wedding_seats WHERE guestId IN ${guestScope}`)
        .bind(partyId, weddingId),
      this.d1
        .prepare("DELETE FROM guests WHERE partyId = ? AND weddingId = ?")
        .bind(partyId, weddingId),
      this.d1
        .prepare("DELETE FROM guest_parties WHERE id = ? AND weddingId = ?")
        .bind(partyId, weddingId),
    ])

    return true
  }
}
