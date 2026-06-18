"use client"

import { useMemo, useState } from "react"
import { GUESTS, type Guest, type RsvpStatus } from "@/lib/wedding-data"
import { cn } from "@/lib/utils"
import {
  Search,
  Mail,
  Send,
  Users,
  LayoutList,
  Armchair,
  GripVertical,
  Plus,
} from "lucide-react"

type Filter = "todos" | "confirmados" | "pendientes" | "declinados"

const RSVP_STYLES: Record<RsvpStatus, string> = {
  Confirmado: "bg-primary/10 text-primary",
  Declinado: "bg-destructive/10 text-destructive",
  "Sin respuesta": "bg-muted text-muted-foreground",
}

export function GuestsView() {
  const [guests, setGuests] = useState<Guest[]>(GUESTS)
  const [tab, setTab] = useState<"lista" | "mesas">("lista")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("todos")
  const [dragId, setDragId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      const matchesQuery = g.name.toLowerCase().includes(query.toLowerCase())
      const matchesFilter =
        filter === "todos" ||
        (filter === "confirmados" && g.rsvp === "Confirmado") ||
        (filter === "pendientes" && g.rsvp === "Sin respuesta") ||
        (filter === "declinados" && g.rsvp === "Declinado")
      return matchesQuery && matchesFilter
    })
  }, [guests, query, filter])

  const confirmed = guests.filter((g) => g.rsvp === "Confirmado")
  const tables = [1, 2, 3, 4]

  function assignTable(guestId: string, table: number | null) {
    setGuests((gs) => gs.map((g) => (g.id === guestId ? { ...g, table } : g)))
  }

  return (
    <div className="space-y-5">
      {/* Tabs + bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          <TabButton active={tab === "lista"} onClick={() => setTab("lista")} icon={LayoutList}>
            Lista de Invitados
          </TabButton>
          <TabButton active={tab === "mesas"} onClick={() => setTab("mesas")} icon={Armchair}>
            Distribución de Mesas
          </TabButton>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            <Send className="h-4 w-4" /> Enviar invitaciones
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary/50">
            <Mail className="h-4 w-4" /> Reenviar recordatorios
          </button>
        </div>
      </div>

      {tab === "lista" ? (
        <>
          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar invitado..."
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-1.5">
              {(["todos", "confirmados", "pendientes", "declinados"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs capitalize transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Grupo</th>
                    <th className="px-4 py-3 font-medium">Invitación</th>
                    <th className="px-4 py-3 font-medium">Asistencia</th>
                    <th className="px-4 py-3 font-medium">Menú</th>
                    <th className="px-4 py-3 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => (
                    <tr key={g.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium text-foreground">{g.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{g.group}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs",
                            g.invite === "Enviada"
                              ? "bg-primary/10 text-primary"
                              : "bg-accent/15 text-accent",
                          )}
                        >
                          {g.invite}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs", RSVP_STYLES[g.rsvp])}>
                          {g.rsvp}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{g.menu}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {g.notes || <span className="text-border">—</span>}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        No se encontraron invitados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Seating plan */
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Unassigned pool */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h3 className="font-serif text-lg text-foreground">Sin asignar</h3>
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragId && assignTable(dragId, null)}
              className="min-h-24 space-y-2"
            >
              {confirmed.filter((g) => g.table === null).map((g) => (
                <GuestChip key={g.id} guest={g} onDragStart={() => setDragId(g.id)} />
              ))}
              {confirmed.filter((g) => g.table === null).length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Todos los invitados tienen mesa.
                </p>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Arrastra a los invitados confirmados hacia cada mesa.
            </p>
          </div>

          {/* Tables grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {tables.map((t) => {
              const seated = confirmed.filter((g) => g.table === t)
              return (
                <div
                  key={t}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dragId && assignTable(dragId, t)}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-serif text-lg text-foreground">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">
                        {t}
                      </span>
                      Mesa {t}
                    </span>
                    <span className="text-xs text-muted-foreground">{seated.length}/8</span>
                  </div>
                  <div className="min-h-20 space-y-2">
                    {seated.map((g) => (
                      <GuestChip key={g.id} guest={g} onDragStart={() => setDragId(g.id)} />
                    ))}
                    {seated.length === 0 && (
                      <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                        <Plus className="mr-1 h-3.5 w-3.5" /> Suelta invitados aquí
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function GuestChip({ guest, onDragStart }: { guest: Guest; onDragStart: () => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 truncate">{guest.name}</span>
      <span className="text-xs text-muted-foreground">{guest.menu}</span>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Users
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}
