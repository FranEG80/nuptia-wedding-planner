export function applyAttendanceChoice<
  T extends { id: string; attending: boolean | null },
>(guests: T[], choice: string): T[] {
  if (choice.startsWith("toggle:")) {
    const guestId = choice.slice("toggle:".length)
    const hasUnansweredGuests = guests.some((guest) => guest.attending === null)

    return guests.map((guest) => ({
      ...guest,
      attending:
        guest.id === guestId
          ? guest.attending !== true
          : hasUnansweredGuests
            ? false
            : guest.attending,
    }))
  }

  return guests.map((guest) => ({
    ...guest,
    attending:
      choice === "all" || choice === `guest:${guest.id}`
        ? true
        : false,
  }))
}
