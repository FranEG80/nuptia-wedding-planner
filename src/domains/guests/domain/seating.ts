type SeatedGuest = { seat: { tableId: string; position: number } | null }

type WithSeat<T extends SeatedGuest> = T & { seat: NonNullable<T["seat"]> }

// Invitados sentados en una mesa, en el orden en que el novio los fue sentando.
// `position` se asigna al sentar (al final de la mesa) y, si el invitado cambia
// de mesa, vuelve a empezar al final de la nueva.
export function seatedGuestsAtTable<T extends SeatedGuest>(
  guests: readonly T[],
  tableId: string,
): WithSeat<T>[] {
  return guests
    .filter((guest): guest is WithSeat<T> => guest.seat?.tableId === tableId)
    .sort((a, b) => a.seat.position - b.seat.position)
}
