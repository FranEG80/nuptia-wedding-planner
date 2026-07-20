import type { Prisma, PrismaClient } from "@generated/prisma/client"
import type {
  D1BatchDatabase,
  D1BatchStatement,
} from "@/core/db/d1-batch"
import type {
  CreateGuestInput,
  CreateInvitationPartyInput,
  GuestInviteParty,
  GuestRepository,
  InvitationPartyGuestInput,
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
} as const satisfies Prisma.GuestInclude

const partyInclude = {
  guests: {
    include: guestInclude,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
} as const satisfies Prisma.GuestPartyInclude

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
  }
}

function toGuestParty(record: PrismaGuestPartyRecord): GuestInviteParty {
  return {
    id: record.id,
    weddingId: record.weddingId,
    inviteToken: record.inviteToken,
    groupName: record.groupName ?? "",
    invite: inviteFromDb[record.inviteStatus] ?? "Pendiente",
    guests: record.guests.map(toGuest),
  }
}

function normalizeContact(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function assertValidPartyMembers(guests: InvitationPartyGuestInput[]) {
  if (guests.length < 1 || guests.length > 2) {
    throw new Error("Una invitación debe contener uno o dos invitados")
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
    const guests = await this.prisma.guest.findMany({
      where: { weddingId },
      include: guestInclude,
      orderBy: [{ party: { groupName: "asc" } }, { name: "asc" }],
    })

    return guests.map(toGuest)
  }

  async listPartiesByWeddingId(
    weddingId: string,
  ): Promise<GuestInviteParty[]> {
    const parties = await this.prisma.guestParty.findMany({
      where: { weddingId },
      include: partyInclude,
      orderBy: [{ groupName: "asc" }, { createdAt: "asc" }],
    })

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
            inviteStatus,
          },
        })
      ).id

    const guest = await this.prisma.guest.create({
      data: {
        partyId,
        weddingId: input.weddingId,
        role: input.role ?? "primary",
        name: input.name,
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

    await this.prisma.$transaction(async (tx) => {
      await tx.guest.update({
        where: { id },
        data: {
          role: input.role,
          name: input.name,
          email: input.email,
          phone: input.phone,
          rsvpStatus: input.rsvp ? rsvpToDb[input.rsvp] : undefined,
          notes: input.notes,
          uploadToken: input.uploadToken,
        },
      })

      if (input.groupName !== undefined || input.invite !== undefined) {
        await tx.guestParty.update({
          where: { id: current.partyId },
          data: {
            groupName: input.groupName,
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
            (id, weddingId, inviteToken, groupName, inviteStatus, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
        )
        .bind(
          partyId,
          input.weddingId,
          inviteToken,
          input.groupName?.trim() || null,
          now,
          now,
        ),
    ]

    for (const [index, guest] of input.guests.entries()) {
      const createdAt = new Date(Date.now() + index).toISOString()

      statements.push(
        this.d1
          .prepare(
            `INSERT INTO guests
              (id, partyId, weddingId, role, name, email, phone, rsvpStatus,
               notes, uploadToken, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'no_response', '', ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            partyId,
            input.weddingId,
            guest.isRecipient ? "primary" : "companion",
            guest.name.trim(),
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
           SET groupName = ?, updatedAt = ?
           WHERE id = ? AND weddingId = ?`,
        )
        .bind(
          input.groupName?.trim() || null,
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

      if (guest.id) {
        statements.push(
          this.d1
            .prepare(
              `UPDATE guests
               SET role = ?, name = ?, email = ?, phone = ?, updatedAt = ?
               WHERE id = ? AND partyId = ? AND weddingId = ?`,
            )
            .bind(
              role,
              guest.name.trim(),
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
              (id, partyId, weddingId, role, name, email, phone, rsvpStatus,
               notes, uploadToken, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'no_response', '', ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            partyId,
            input.weddingId,
            role,
            guest.name.trim(),
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

    if (!party) {
      return null
    }

    if (party.guests.length < 1 || party.guests.length > 2) {
      throw new Error("La invitación no contiene uno o dos invitados válidos")
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

    await this.d1.batch(statements)

    return this.findPartyByInviteToken(inviteToken)
  }
}
