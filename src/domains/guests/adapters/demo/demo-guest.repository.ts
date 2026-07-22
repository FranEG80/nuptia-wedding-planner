import type { Guest } from "@/domains/guests/domain/guest"
import type {
  CreateGuestInput,
  GuestInviteParty,
  GuestRepository,
  UpdateGuestInput,
} from "@/domains/guests/domain/ports/guest.repository"
import { DEMO_WEDDING_ID } from "@/domains/weddings/adapters/demo/demo-wedding.repository"

function composeFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ")
}

function demoGuest(input: {
  id: string
  firstName: string
  lastName?: string
  groupName: string
  invite: Guest["party"]["invite"]
  rsvp: Guest["rsvp"]
  notes: string
  table: number | null
}): Guest {
  const partyId = `party-${input.id}`
  const firstName = input.firstName
  const lastName = input.lastName ?? ""

  return {
    id: input.id,
    partyId,
    weddingId: DEMO_WEDDING_ID,
    appUserId: null,
    role: "primary",
    name: composeFullName(firstName, lastName),
    firstName,
    lastName,
    email: null,
    phone: null,
    rsvp: input.rsvp,
    notes: input.notes,
    uploadToken: `upload-${input.id}`,
    party: {
      id: partyId,
      weddingId: DEMO_WEDDING_ID,
      inviteToken: `demo-token-${input.id}`,
      groupName: input.groupName,
      invite: input.invite,
    },
    seat: input.table
      ? {
          id: `seat-${input.id}`,
          tableId: `table-${input.table}`,
          tableName: `Mesa ${input.table}`,
          position: 1,
        }
      : null,
    invitedBy: [],
    menuSelections: [],
  }
}

let demoGuests: Guest[] = [
  demoGuest({ id: "g1", firstName: "María", lastName: "López", groupName: "Familia Novia", invite: "Enviada", rsvp: "Confirmado", notes: "Sin gluten", table: 1 }),
  demoGuest({ id: "g2", firstName: "Javier", lastName: "Ruiz", groupName: "Familia Novia", invite: "Enviada", rsvp: "Confirmado", notes: "", table: 1 }),
  demoGuest({ id: "g3", firstName: "Lucía", lastName: "Fernández", groupName: "Amigos Novia", invite: "Enviada", rsvp: "Confirmado", notes: "Alérgica a frutos secos", table: 2 }),
  demoGuest({ id: "g4", firstName: "Diego", lastName: "Morales", groupName: "Amigos Novio", invite: "Enviada", rsvp: "Sin respuesta", notes: "", table: null }),
  demoGuest({ id: "g5", firstName: "Carmen", lastName: "Vega", groupName: "Familia Novio", invite: "Enviada", rsvp: "Confirmado", notes: "", table: 3 }),
  demoGuest({ id: "g6", firstName: "Pablo", lastName: "Castro", groupName: "Trabajo", invite: "Pendiente", rsvp: "Sin respuesta", notes: "", table: null }),
  demoGuest({ id: "g7", firstName: "Elena", lastName: "Navarro", groupName: "Amigos Novia", invite: "Enviada", rsvp: "Declinado", notes: "No podrá asistir", table: null }),
  demoGuest({ id: "g8", firstName: "Sergio", lastName: "Ramos", groupName: "Familia Novio", invite: "Enviada", rsvp: "Confirmado", notes: "", table: 3 }),
  demoGuest({ id: "g9", firstName: "Marta", lastName: "Gil", groupName: "Amigos Novia", invite: "Enviada", rsvp: "Confirmado", notes: "", table: 2 }),
  demoGuest({ id: "g10", firstName: "Andrés", lastName: "Soto", groupName: "Trabajo", invite: "Pendiente", rsvp: "Sin respuesta", notes: "", table: null }),
  demoGuest({ id: "g11", firstName: "Beatriz", lastName: "Ortiz", groupName: "Familia Novia", invite: "Enviada", rsvp: "Confirmado", notes: "Trona para bebé", table: 1 }),
  demoGuest({ id: "g12", firstName: "Hugo", lastName: "Méndez", groupName: "Amigos Novio", invite: "Enviada", rsvp: "Confirmado", notes: "", table: null }),
]

export const demoGuestRepository: GuestRepository = {
  async listByWeddingId(weddingId) {
    return demoGuests.filter((guest) => guest.weddingId === weddingId)
  },

  async listPartiesByWeddingId(weddingId) {
    const tokens = [
      ...new Set(
        demoGuests
          .filter((guest) => guest.weddingId === weddingId)
          .map((guest) => guest.party.inviteToken),
      ),
    ]

    return tokens.flatMap((token) => {
      const party = partyByInviteToken(token)
      return party ? [party] : []
    })
  },

  async findPartyByInviteToken(inviteToken) {
    return partyByInviteToken(inviteToken)
  },

  async findPublicPartyByInviteToken(inviteToken) {
    const party = partyByInviteToken(inviteToken)

    return party
      ? {
          id: party.id,
          weddingId: party.weddingId,
          inviteToken: party.inviteToken,
          groupName: party.groupName,
          invite: party.invite,
          guests: party.guests.map((guest) => ({
            id: guest.id,
            role: guest.role,
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            notes: guest.notes,
            rsvp: guest.rsvp,
            menuSelections: guest.menuSelections,
          })),
        }
      : null
  },

  async findById(id) {
    return demoGuests.find((guest) => guest.id === id) ?? null
  },

  async create(input: CreateGuestInput) {
    const id = `guest-${Date.now()}`
    const guest = demoGuest({
      id,
      firstName: input.firstName,
      lastName: input.lastName,
      groupName: input.groupName ?? "",
      invite: input.invite ?? "Pendiente",
      rsvp: input.rsvp ?? "Sin respuesta",
      notes: input.notes ?? "",
      table: null,
    })
    const nextGuest = {
      ...guest,
      partyId: input.partyId ?? guest.partyId,
      role: input.role ?? guest.role,
      email: input.email ?? null,
      phone: input.phone ?? null,
    }

    demoGuests = [...demoGuests, nextGuest]

    return nextGuest
  },

  async update(id: string, input: UpdateGuestInput) {
    const current = demoGuests.find((guest) => guest.id === id)

    if (!current) {
      return null
    }

    const firstName = input.firstName ?? current.firstName
    const lastName = input.lastName ?? current.lastName
    const next: Guest = {
      ...current,
      role: input.role ?? current.role,
      name: composeFullName(firstName, lastName),
      firstName,
      lastName,
      email: input.email === undefined ? current.email : input.email,
      phone: input.phone === undefined ? current.phone : input.phone,
      rsvp: input.rsvp ?? current.rsvp,
      notes: input.notes ?? current.notes,
      uploadToken:
        input.uploadToken === undefined ? current.uploadToken : input.uploadToken,
      party: {
        ...current.party,
        groupName: input.groupName ?? current.party.groupName,
        invite: input.invite ?? current.party.invite,
      },
    }

    demoGuests = demoGuests.map((guest) => (guest.id === id ? next : guest))

    return next
  },

  async createInvitationParty(input) {
    const partyId = `party-${Date.now()}`
    const inviteToken = `demo-token-${Date.now()}`
    const partyGuests = input.guests.map((item, index): Guest => {
      const guest = demoGuest({
        id: `guest-${Date.now()}-${index}`,
        firstName: item.firstName,
        lastName: item.lastName,
        groupName: input.groupName ?? "",
        invite: "Pendiente",
        rsvp: "Sin respuesta",
        notes: "",
        table: null,
      })

      return {
        ...guest,
        partyId,
        role: item.isRecipient ? "primary" : "companion",
        email: item.email ?? null,
        phone: item.phone ?? null,
        party: {
          ...guest.party,
          id: partyId,
          inviteToken,
        },
      }
    })

    demoGuests = [...demoGuests, ...partyGuests]

    return partyByInviteToken(inviteToken)!
  },

  async updateInvitationParty(partyId, input) {
    const currentGuests = demoGuests.filter(
      (guest) =>
        guest.partyId === partyId && guest.weddingId === input.weddingId,
    )

    if (!currentGuests.length) {
      return null
    }

    const currentIds = new Set(currentGuests.map((guest) => guest.id))
    const submittedIds = new Set(
      input.guests.flatMap((guest) => (guest.id ? [guest.id] : [])),
    )
    const compositionLocked =
      currentGuests[0].party.invite === "Enviada" ||
      currentGuests.some((guest) => guest.rsvp !== "Sin respuesta")

    if (
      compositionLocked &&
      (submittedIds.size !== currentIds.size ||
        input.guests.some((guest) => !guest.id) ||
        [...currentIds].some((id) => !submittedIds.has(id)))
    ) {
      throw new Error(
        "No se puede cambiar la composición de una invitación enviada o respondida",
      )
    }

    const party = currentGuests[0].party
    demoGuests = demoGuests.filter(
      (guest) => guest.partyId !== partyId || submittedIds.has(guest.id),
    )

    for (const [index, item] of input.guests.entries()) {
      const id = item.id ?? `guest-${Date.now()}-${index}`
      const current = demoGuests.find((guest) => guest.id === id)
      const base =
        current ??
        demoGuest({
          id,
          firstName: item.firstName,
          lastName: item.lastName,
          groupName: input.groupName ?? "",
          invite: party.invite,
          rsvp: "Sin respuesta",
          notes: "",
          table: null,
        })
      const firstName = item.firstName
      const lastName = item.lastName ?? ""
      const next: Guest = {
        ...base,
        partyId,
        weddingId: input.weddingId,
        role: item.isRecipient ? "primary" : "companion",
        name: composeFullName(firstName, lastName),
        firstName,
        lastName,
        email: item.email ?? null,
        phone: item.phone ?? null,
        party: {
          ...party,
          groupName: input.groupName ?? "",
        },
      }

      demoGuests = current
        ? demoGuests.map((guest) => (guest.id === id ? next : guest))
        : [...demoGuests, next]
    }

    return partyByInviteToken(party.inviteToken)
  },

  async markPartiesInvited(weddingId, partyIds) {
    demoGuests = demoGuests.map((guest) =>
      guest.weddingId === weddingId && partyIds.includes(guest.partyId)
        ? { ...guest, party: { ...guest.party, invite: "Enviada" } }
        : guest,
    )

    return demoGuests.filter((guest) => guest.weddingId === weddingId)
  },

  async respondToParty(inviteToken, rsvp) {
    const party = partyByInviteToken(inviteToken)

    if (!party) {
      return null
    }

    demoGuests = demoGuests.map((guest) =>
      guest.party.inviteToken === inviteToken ? { ...guest, rsvp } : guest,
    )

    return partyByInviteToken(inviteToken)
  },

  async respondToPartyWithDetails(inviteToken, input) {
    const party = partyByInviteToken(inviteToken)

    if (!party) {
      return null
    }

    const partyGuestIds = new Set(party.guests.map((guest) => guest.id))
    const responseIds = input.guests.map((guest) => guest.guestId)

    if (
      responseIds.length !== partyGuestIds.size ||
      new Set(responseIds).size !== responseIds.length ||
      responseIds.some((id) => !partyGuestIds.has(id))
    ) {
      throw new Error(
        "La respuesta debe incluir una única respuesta para cada invitado del enlace",
      )
    }

    demoGuests = demoGuests.map((guest) => {
      if (!partyGuestIds.has(guest.id)) {
        return guest
      }

      const response = input.guests.find((item) => item.guestId === guest.id)

      if (!response) {
        return guest
      }

      return {
        ...guest,
        email: response.email === undefined ? guest.email : response.email,
        phone: response.phone === undefined ? guest.phone : response.phone,
        notes: response.attending ? response.notes ?? guest.notes : "",
        rsvp: response.attending ? "Confirmado" : "Declinado",
        menuSelections: response.attending
          ? response.menuSelections ?? []
          : [],
      }
    })

    return partyByInviteToken(inviteToken)
  },

  async assignSeat(guestId, weddingId, tableId) {
    const current = demoGuests.find(
      (guest) => guest.id === guestId && guest.weddingId === weddingId,
    )

    if (!current) {
      return null
    }

    const next: Guest = {
      ...current,
      seat: {
        id: `seat-${guestId}`,
        tableId,
        tableName: tableId,
        position: 1,
      },
    }

    demoGuests = demoGuests.map((guest) => (guest.id === guestId ? next : guest))

    return next
  },

  async unassignSeat(guestId, weddingId) {
    const current = demoGuests.find(
      (guest) => guest.id === guestId && guest.weddingId === weddingId,
    )

    if (!current) {
      return null
    }

    const next: Guest = { ...current, seat: null }

    demoGuests = demoGuests.map((guest) => (guest.id === guestId ? next : guest))

    return next
  },

  async deleteInvitationParty(partyId, weddingId) {
    const existed = demoGuests.some(
      (guest) => guest.partyId === partyId && guest.weddingId === weddingId,
    )

    demoGuests = demoGuests.filter(
      (guest) => !(guest.partyId === partyId && guest.weddingId === weddingId),
    )

    return existed
  },
}

function partyByInviteToken(inviteToken: string): GuestInviteParty | null {
  const guests = demoGuests.filter((guest) => guest.party.inviteToken === inviteToken)
  const firstGuest = guests[0]

  if (!firstGuest) {
    return null
  }

  return {
    id: firstGuest.partyId,
    weddingId: firstGuest.weddingId,
    inviteToken,
    groupName: firstGuest.party.groupName,
    invite: firstGuest.party.invite,
    guests,
  }
}
