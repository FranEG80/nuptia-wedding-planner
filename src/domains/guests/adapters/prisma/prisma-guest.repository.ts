import type { Prisma, PrismaClient } from "@generated/prisma/client"
import type {
  CreateGuestInput,
  GuestInviteParty,
  GuestRepository,
  RespondToPartyGuestInput,
  UpdateGuestInput,
} from "@/domains/guests/domain/ports/guest.repository"
import type {
  Guest,
  GuestInviteStatus,
  GuestRole,
  GuestRsvpStatus,
} from "@/domains/guests/domain/guest"

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
}

type PrismaGuestRecord = NonNullable<
  Awaited<ReturnType<PrismaGuestRepository["findRecordById"]>>
>

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

export class PrismaGuestRepository implements GuestRepository {
  constructor(private readonly prisma: PrismaClient) {}

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

  async findPartyByInviteToken(
    inviteToken: string,
  ): Promise<GuestInviteParty | null> {
    const party = await this.prisma.guestParty.findUnique({
      where: { inviteToken },
      include: {
        guests: {
          include: guestInclude,
          orderBy: [{ role: "asc" }, { name: "asc" }],
        },
      },
    })

    if (!party) {
      return null
    }

    return {
      id: party.id,
      weddingId: party.weddingId,
      inviteToken: party.inviteToken,
      groupName: party.groupName ?? "",
      guests: party.guests.map(toGuest),
    }
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
          },
        },
      },
    })

    if (!party) {
      return null
    }

    const partyGuestIds = new Set(party.guests.map((guest) => guest.id))
    const submittedExistingIds = new Set(
      input.guests
        .map((guest) => guest.id)
        .filter((id): id is string => Boolean(id)),
    )
    const confirmedGuests = input.guests.filter(
      (guest) => guest.rsvp === "Confirmado",
    )
    const confirmedExistingIds = new Set(
      confirmedGuests
        .map((guest) => guest.id)
        .filter((id): id is string => Boolean(id)),
    )
    let messageGuestId =
      confirmedGuests.find((guest) => guest.id && partyGuestIds.has(guest.id))
        ?.id ?? party.guests[0]?.id

    await this.prisma.$transaction(async (tx) => {
      for (const existingGuest of party.guests) {
        if (
          !submittedExistingIds.has(existingGuest.id) ||
          !confirmedExistingIds.has(existingGuest.id)
        ) {
          await tx.guest.update({
            where: { id: existingGuest.id },
            data: { rsvpStatus: "declined" },
          })
        }
      }

      for (const guest of input.guests) {
        if (guest.id && partyGuestIds.has(guest.id)) {
          await tx.guest.update({
            where: { id: guest.id },
            data: {
              name: guest.name,
              email: guest.email ?? null,
              phone: guest.phone ?? null,
              notes: guest.notes ?? "",
              rsvpStatus: rsvpToDb[guest.rsvp],
            },
          })

          await replaceMenuSelections(tx, guest.id, guest.menuSelections)
          continue
        }

        if (guest.rsvp !== "Confirmado") {
          continue
        }

        const created = await tx.guest.create({
          data: {
            partyId: party.id,
            weddingId: party.weddingId,
            role: guest.role ?? "companion",
            name: guest.name,
            email: guest.email ?? null,
            phone: guest.phone ?? null,
            notes: guest.notes ?? "",
            rsvpStatus: "confirmed",
          },
          select: { id: true },
        })

        messageGuestId =
          messageGuestId && messageGuestId !== party.guests[0]?.id
            ? messageGuestId
            : created.id

        await replaceMenuSelections(tx, created.id, guest.menuSelections)
      }

      const message = input.message?.trim()

      if (message && messageGuestId) {
        await tx.guestMessage.create({
          data: {
            weddingId: party.weddingId,
            guestId: messageGuestId,
            message,
          },
        })
      }
    })

    return this.findPartyByInviteToken(inviteToken)
  }
}

async function replaceMenuSelections(
  tx: Prisma.TransactionClient,
  guestId: string,
  selections: Array<{ menuDishId: string; dishOptionId: string }> | undefined,
) {
  await tx.guestMenuSelection.deleteMany({
    where: { guestId },
  })

  const validSelections = (selections ?? []).filter(
    (selection) => selection.menuDishId && selection.dishOptionId,
  )

  if (!validSelections.length) {
    return
  }

  const menuDishes = await tx.restaurantMenuDish.findMany({
    where: {
      id: {
        in: validSelections.map((selection) => selection.menuDishId),
      },
    },
    select: {
      id: true,
      dish: {
        select: {
          options: {
            select: { id: true },
          },
        },
      },
    },
  })
  const validPairs = new Set(
    menuDishes.flatMap((menuDish) =>
      menuDish.dish.options.map((option) => `${menuDish.id}:${option.id}`),
    ),
  )
  const safeSelections = validSelections.filter((selection) =>
    validPairs.has(`${selection.menuDishId}:${selection.dishOptionId}`),
  )

  if (!safeSelections.length) {
    return
  }

  await tx.guestMenuSelection.createMany({
    data: safeSelections.map((selection) => ({
      guestId,
      menuDishId: selection.menuDishId,
      dishOptionId: selection.dishOptionId,
    })),
  })
}
