export function getAttendanceGroupLabel(guestCount: number): string {
  if (guestCount <= 1) {
    return "Asistiré"
  }

  return guestCount === 2 ? "Asistiremos los dos" : "Asistiremos todos"
}
