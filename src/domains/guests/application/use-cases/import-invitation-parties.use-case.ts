import {
  createInvitationPartySchema,
  toInvitationPartyDto,
  type CreateInvitationPartyDto,
  type InvitationPartyDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import {
  normalizeGuestEmail,
  normalizeGuestPhone,
} from "@/domains/guests/application/guest-import"
import type { Guest } from "@/domains/guests/domain/guest"
import type {
  GuestInviteParty,
  GuestRepository,
  InvitationPartyGuestInput,
} from "@/domains/guests/domain/ports/guest.repository"

interface IndexedGuest {
  partyId: string
  guestId: string
}

export interface ImportInvitationPartiesResult {
  parties: InvitationPartyDto[]
  created: number
  merged: number
  skipped: number
  warnings: string[]
}

function contactKeys(guest: {
  email?: string | null
  phone?: string | null
}): string[] {
  const keys: string[] = []
  const email = normalizeGuestEmail(guest.email)
  const phone = normalizeGuestPhone(guest.phone)

  if (email) {
    keys.push(`email:${email}`)
  }
  if (phone) {
    keys.push(`phone:${phone}`)
  }

  return keys
}

function addPartyToIndex(
  index: Map<string, IndexedGuest[]>,
  party: GuestInviteParty,
) {
  for (const guest of party.guests) {
    for (const key of contactKeys(guest)) {
      const entries = index.get(key) ?? []
      entries.push({ partyId: party.id, guestId: guest.id })
      index.set(key, entries)
    }
  }
}

function guestInputFromExisting(guest: Guest): InvitationPartyGuestInput {
  return {
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    isRecipient: guest.role === "primary",
  }
}

export async function importInvitationPartiesUseCase(input: {
  guestRepository: GuestRepository
  weddingId: string
  parties: CreateInvitationPartyDto[]
}): Promise<ImportInvitationPartiesResult> {
  const currentParties = await input.guestRepository.listPartiesByWeddingId(
    input.weddingId,
  )
  const partiesById = new Map(currentParties.map((party) => [party.id, party]))
  const contactIndex = new Map<string, IndexedGuest[]>()

  for (const party of currentParties) {
    addPartyToIndex(contactIndex, party)
  }

  const result: ImportInvitationPartiesResult = {
    parties: [],
    created: 0,
    merged: 0,
    skipped: 0,
    warnings: [],
  }

  for (const rawParty of input.parties) {
    const parsed = createInvitationPartySchema.safeParse(rawParty)

    if (!parsed.success) {
      result.skipped += 1
      result.warnings.push(
        `Se omitió una invitación: ${parsed.error.issues
          .map((issue) => issue.message)
          .join(" ")}`,
      )
      continue
    }

    const data = parsed.data
    const inputContacts = new Set<string>()
    const hasRepeatedInputContact = data.guests.some((guest) =>
      contactKeys(guest).some((key) => {
        if (inputContacts.has(key)) {
          return true
        }

        inputContacts.add(key)
        return false
      }),
    )

    if (hasRepeatedInputContact) {
      result.skipped += 1
      result.warnings.push(
        `Se omitió la invitación de ${data.guests
          .map((guest) => guest.firstName)
          .join(" y ")}: contiene un email o teléfono repetido entre sus personas.`,
      )
      continue
    }

    const matchesByGuest = data.guests.map((guest) => {
      const matches = new Map<string, IndexedGuest>()

      for (const key of contactKeys(guest)) {
        for (const match of contactIndex.get(key) ?? []) {
          matches.set(`${match.partyId}:${match.guestId}`, match)
        }
      }

      return [...matches.values()]
    })
    const matchedGuests = [
      ...new Map(
        matchesByGuest
          .flat()
          .map((match) => [`${match.partyId}:${match.guestId}`, match]),
      ).values(),
    ]
    const matchedPartyIds = [
      ...new Set(matchedGuests.map((match) => match.partyId)),
    ]

    if (matchedPartyIds.length > 1) {
      result.skipped += 1
      result.warnings.push(
        `Se omitió la invitación de ${data.guests
          .map((guest) => guest.firstName)
          .join(" y ")}: sus contactos coinciden con invitaciones distintas.`,
      )
      continue
    }

    if (matchedPartyIds.length === 0) {
      const created = await input.guestRepository.createInvitationParty({
        weddingId: input.weddingId,
        groupName: data.groupName,
        guests: data.guests,
      })
      const createdDto = toInvitationPartyDto(created)

      partiesById.set(created.id, created)
      addPartyToIndex(contactIndex, created)
      result.parties.push(createdDto)
      result.created += 1
      continue
    }

    const existingParty = partiesById.get(matchedPartyIds[0])

    if (!existingParty) {
      result.skipped += 1
      result.warnings.push(
        `Se omitió la invitación de ${data.guests
          .map((guest) => guest.firstName)
          .join(" y ")}: el invitado ya no está disponible.`,
      )
      continue
    }

    const newGuests = data.guests.filter(
      (_, index) => matchesByGuest[index].length === 0,
    )

    if (newGuests.length === 0) {
      result.skipped += 1
      result.warnings.push(
        `Se omitió la invitación de ${data.guests
          .map((guest) => guest.firstName)
          .join(" y ")}: todos sus contactos ya estaban importados.`,
      )
      continue
    }

    if (existingParty.guests.length >= 2 || newGuests.length !== 1) {
      result.skipped += 1
      result.warnings.push(
        `Se omitió el acompañante de ${data.guests
          .map((guest) => guest.firstName)
          .join(" y ")}: la invitación existente ya tiene dos personas.`,
      )
      continue
    }

    const mergedInput = [
      ...existingParty.guests.map(guestInputFromExisting),
      { ...newGuests[0], isRecipient: false },
    ]
    const groupName = existingParty.groupName || data.groupName

    try {
      const updated = await input.guestRepository.updateInvitationParty(
        existingParty.id,
        {
          weddingId: input.weddingId,
          groupName,
          guests: mergedInput,
        },
      )

      if (!updated) {
        throw new Error("No se pudo recuperar la invitación actualizada")
      }

      partiesById.set(updated.id, updated)
      addPartyToIndex(contactIndex, updated)
      result.parties.push(toInvitationPartyDto(updated))
      result.merged += 1
    } catch (error) {
      result.skipped += 1
      result.warnings.push(
        `No se añadió el acompañante de ${data.guests
          .map((guest) => guest.firstName)
          .join(" y ")}: ${
          error instanceof Error
            ? error.message
            : "la invitación no se puede modificar"
        }.`,
      )
    }
  }

  return result
}
