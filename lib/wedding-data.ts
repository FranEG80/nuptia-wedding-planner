export const WEDDING = {
  brideName: "Ana",
  groomName: "Carlos",
  date: "2026-09-12T17:00:00",
  venueCity: "Toledo, España",
}

export type InviteStatus = "Enviada" | "Pendiente"
export type RsvpStatus = "Confirmado" | "Declinado" | "Sin respuesta"

export interface Guest {
  id: string
  name: string
  group: string
  invite: InviteStatus
  rsvp: RsvpStatus
  menu: string
  notes: string
  table: number | null
}

export const GROUPS = [
  "Familia Novia",
  "Familia Novio",
  "Amigos Novia",
  "Amigos Novio",
  "Trabajo",
]

export const MENUS = ["Carne", "Pescado", "Vegetariano", "Infantil", "—"]

export const GUESTS: Guest[] = [
  { id: "g1", name: "María López", group: "Familia Novia", invite: "Enviada", rsvp: "Confirmado", menu: "Pescado", notes: "Sin gluten", table: 1 },
  { id: "g2", name: "Javier Ruiz", group: "Familia Novia", invite: "Enviada", rsvp: "Confirmado", menu: "Carne", notes: "", table: 1 },
  { id: "g3", name: "Lucía Fernández", group: "Amigos Novia", invite: "Enviada", rsvp: "Confirmado", menu: "Vegetariano", notes: "Alérgica a frutos secos", table: 2 },
  { id: "g4", name: "Diego Morales", group: "Amigos Novio", invite: "Enviada", rsvp: "Sin respuesta", menu: "—", notes: "", table: null },
  { id: "g5", name: "Carmen Vega", group: "Familia Novio", invite: "Enviada", rsvp: "Confirmado", menu: "Carne", notes: "", table: 3 },
  { id: "g6", name: "Pablo Castro", group: "Trabajo", invite: "Pendiente", rsvp: "Sin respuesta", menu: "—", notes: "", table: null },
  { id: "g7", name: "Elena Navarro", group: "Amigos Novia", invite: "Enviada", rsvp: "Declinado", menu: "—", notes: "No podrá asistir", table: null },
  { id: "g8", name: "Sergio Ramos", group: "Familia Novio", invite: "Enviada", rsvp: "Confirmado", menu: "Pescado", notes: "", table: 3 },
  { id: "g9", name: "Marta Gil", group: "Amigos Novia", invite: "Enviada", rsvp: "Confirmado", menu: "Vegetariano", notes: "", table: 2 },
  { id: "g10", name: "Andrés Soto", group: "Trabajo", invite: "Pendiente", rsvp: "Sin respuesta", menu: "—", notes: "", table: null },
  { id: "g11", name: "Beatriz Ortiz", group: "Familia Novia", invite: "Enviada", rsvp: "Confirmado", menu: "Infantil", notes: "Trona para bebé", table: 1 },
  { id: "g12", name: "Hugo Méndez", group: "Amigos Novio", invite: "Enviada", rsvp: "Confirmado", menu: "Carne", notes: "", table: null },
]

export const TIMELINE = [
  { time: "17:00", label: "Ceremonia", icon: "church" },
  { time: "18:30", label: "Cóctel de bienvenida", icon: "glass" },
  { time: "21:00", label: "Cena", icon: "utensils" },
  { time: "00:00", label: "Fiesta", icon: "music" },
]
