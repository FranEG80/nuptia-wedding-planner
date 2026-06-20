import type { Guest } from "@/domains/guests/domain/guest"
import type {
  CreateGuestInput,
  GuestInviteParty,
  GuestRepository,
  UpdateGuestInput,
} from "@/domains/guests/domain/ports/guest.repository"
import { DEMO_WEDDING_ID } from "@/domains/weddings/adapters/demo/demo-wedding.repository"

function demoGuest(input: {
  id: string
  name: string
  groupName: string
  invite: Guest["party"]["invite"]
  rsvp: Guest["rsvp"]
  notes: string
  table: number | null
}): Guest {
  const partyId = `party-${input.id}`

  return {
    id: input.id,
    partyId,
    weddingId: DEMO_WEDDING_ID,
    appUserId: null,
    role: "primary",
    name: input.name,
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
  demoGuest({ id: "g1", name: "María López", groupName: "Familia Novia", invite: "Enviada", rsvp: "Confirmado", notes: "Sin gluten", table: 1 }),
  demoGuest({ id: "g2", name: "Javier Ruiz", groupName: "Familia Novia", invite: "Enviada", rsvp: "Confirmado", notes: "", table: 1 }),
  demoGuest({ id: "g3", name: "Lucía Fernández", groupName: "Amigos Novia", invite: "Enviada", rsvp: "Confirmado", notes: "Alérgica a frutos secos", table: 2 }),
  demoGuest({ id: "g4", name: "Diego Morales", groupName: "Amigos Novio", invite: "Enviada", rsvp: "Sin respuesta", notes: "", table: null }),
  demoGuest({ id: "g5", name: "Carmen Vega", groupName: "Familia Novio", invite: "Enviada", rsvp: "Confirmado", notes: "", table: 3 }),
  demoGuest({ id: "g6", name: "Pablo Castro", groupName: "Trabajo", invite: "Pendiente", rsvp: "Sin respuesta", notes: "", table: null }),
  demoGuest({ id: "g7", name: "Elena Navarro", groupName: "Amigos Novia", invite: "Enviada", rsvp: "Declinado", notes: "No podrá asistir", table: null }),
  demoGuest({ id: "g8", name: "Sergio Ramos", groupName: "Familia Novio", invite: "Enviada", rsvp: "Confirmado", notes: "", table: 3 }),
  demoGuest({ id: "g9", name: "Marta Gil", groupName: "Amigos Novia", invite: "Enviada", rsvp: "Confirmado", notes: "", table: 2 }),
  demoGuest({ id: "g10", name: "Andrés Soto", groupName: "Trabajo", invite: "Pendiente", rsvp: "Sin respuesta", notes: "", table: null }),
  demoGuest({ id: "g11", name: "Beatriz Ortiz", groupName: "Familia Novia", invite: "Enviada", rsvp: "Confirmado", notes: "Trona para bebé", table: 1 }),
  demoGuest({ id: "g12", name: "Hugo Méndez", groupName: "Amigos Novio", invite: "Enviada", rsvp: "Confirmado", notes: "", table: null }),
]

export const demoGuestRepository: GuestRepository = {
  async listByWeddingId(weddingId) {
    return demoGuests.filter((guest) => guest.weddingId === weddingId)
  },

  async findPartyByInviteToken(inviteToken) {
    return partyByInviteToken(inviteToken)
  },

  async findById(id) {
    return demoGuests.find((guest) => guest.id === id) ?? null
  },

  async create(input: CreateGuestInput) {
    const id = `guest-${Date.now()}`
    const guest = demoGuest({
      id,
      name: input.name,
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

    const next: Guest = {
      ...current,
      role: input.role ?? current.role,
      name: input.name ?? current.name,
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

    demoGuests = demoGuests.map((guest) => {
      if (!partyGuestIds.has(guest.id)) {
        return guest
      }

      const response = input.guests.find((item) => item.id === guest.id)

      if (!response) {
        return { ...guest, rsvp: "Declinado", menuSelections: [] }
      }

      return {
        ...guest,
        name: response.name,
        email: response.email ?? null,
        phone: response.phone ?? null,
        notes: response.notes ?? "",
        rsvp: response.rsvp,
        menuSelections: response.menuSelections ?? [],
      }
    })

    const existingIds = new Set(demoGuests.map((guest) => guest.id))
    const newGuests = input.guests
      .filter((guest) => !guest.id || !existingIds.has(guest.id))
      .filter((guest) => guest.rsvp === "Confirmado")
      .map((guest, index): Guest => {
        const id = `guest-${Date.now()}-${index}`
        const firstPartyGuest = party.guests[0]

        return {
          ...firstPartyGuest,
          id,
          role: guest.role ?? "companion",
          name: guest.name,
          email: guest.email ?? null,
          phone: guest.phone ?? null,
          notes: guest.notes ?? "",
          rsvp: "Confirmado",
          seat: null,
          invitedBy: [],
          uploadToken: `upload-${id}`,
          menuSelections: guest.menuSelections ?? [],
        }
      })

    demoGuests = [...demoGuests, ...newGuests]

    return partyByInviteToken(inviteToken)
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
    guests,
  }
}
