"use client"

import { useMemo, useState, useTransition } from "react"

import type { GuestDto } from "@/domains/guests/application/dtos/guest.dto"
import { markGuestPartiesInvitedAction } from "@/domains/guests/adapters/next/actions"
import { cn } from "@/shared/lib/utils"
import {
  Search,
  Mail,
  Send,
  Users,
  LayoutList,
  Armchair,
  GripVertical,
  Plus,
  MessageCircle,
  Copy,
} from "lucide-react"

type Filter = "todos" | "confirmados" | "pendientes" | "declinados"
type RsvpStatus = GuestDto["rsvp"]

const RSVP_STYLES: Record<RsvpStatus, string> = {
  Confirmado: "bg-primary/10 text-primary",
  Declinado: "bg-destructive/10 text-destructive",
  "Sin respuesta": "bg-muted text-muted-foreground",
}

export function GuestsView({
  initialGuests,
  initialWhatsappMessage,
}: {
  initialGuests: GuestDto[]
  initialWhatsappMessage: string
}) {
  const [guests, setGuests] = useState<GuestDto[]>(initialGuests)
  const [tab, setTab] = useState<"lista" | "mesas">("lista")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("todos")
  const [dragId, setDragId] = useState<string | null>(null)
  const [selectedPartyIds, setSelectedPartyIds] = useState<string[]>([])
  const [whatsappMessage, setWhatsappMessage] = useState(initialWhatsappMessage)
  const [copied, setCopied] = useState(false)
  const [isSending, startSending] = useTransition()

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
  const parties = useMemo(() => {
    const map = new Map<
      string,
      {
        partyId: string
        group: string
        inviteToken: string
        phone: string | null
        guestName: string
        guests: GuestDto[]
      }
    >()

    for (const guest of guests) {
      const current = map.get(guest.partyId)

      if (current) {
        current.guests.push(guest)
        current.phone = current.phone ?? guest.phone
      } else {
        map.set(guest.partyId, {
          partyId: guest.partyId,
          group: guest.group,
          inviteToken: guest.inviteToken,
          phone: guest.phone,
          guestName: guest.name,
          guests: [guest],
        })
      }
    }

    return Array.from(map.values())
  }, [guests])
  const selectedParties = parties.filter((party) =>
    selectedPartyIds.includes(party.partyId),
  )

  function assignTable(guestId: string, table: number | null) {
    setGuests((gs) => gs.map((g) => (g.id === guestId ? { ...g, table } : g)))
  }

  function toggleParty(partyId: string) {
    setSelectedPartyIds((current) =>
      current.includes(partyId)
        ? current.filter((id) => id !== partyId)
        : [...current, partyId],
    )
  }

  function toggleVisibleParties() {
    const visiblePartyIds = Array.from(new Set(filtered.map((guest) => guest.partyId)))
    const allVisibleSelected = visiblePartyIds.every((partyId) =>
      selectedPartyIds.includes(partyId),
    )

    setSelectedPartyIds((current) =>
      allVisibleSelected
        ? current.filter((partyId) => !visiblePartyIds.includes(partyId))
        : Array.from(new Set([...current, ...visiblePartyIds])),
    )
  }

  function invitationMessage(party: (typeof selectedParties)[number]) {
    const inviteUrl = `${window.location.origin}/i/${party.inviteToken}`

    return whatsappMessage
      .replaceAll("{guestName}", party.guestName)
      .replaceAll("{groupName}", party.group || party.guestName)
      .replaceAll("{inviteUrl}", inviteUrl)
  }

  function sendSelectedInvitations() {
    if (selectedParties.length === 0) {
      return
    }

    const partiesToSend = selectedParties
    let fallbackText = ""

    for (const party of partiesToSend) {
      const text = invitationMessage(party)
      const phone = party.phone?.replace(/[^\d]/g, "")

      if (phone) {
        window.open(
          `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
          "_blank",
          "noopener,noreferrer",
        )
      } else {
        fallbackText += `${party.guestName}: ${text}\n\n`
      }
    }

    if (fallbackText) {
      void navigator.clipboard?.writeText(fallbackText.trim())
      setCopied(true)
    }

    startSending(async () => {
      const nextGuests = await markGuestPartiesInvitedAction(
        partiesToSend.map((party) => party.partyId),
      )
      setGuests(nextGuests)
      setSelectedPartyIds([])
    })
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
          <button
            type="button"
            onClick={sendSelectedInvitations}
            disabled={selectedParties.length === 0 || isSending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSending ? "Marcando..." : "Enviar por WhatsApp"}
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary/50">
            <Mail className="h-4 w-4" /> Reenviar recordatorios
          </button>
        </div>
      </div>

      {selectedParties.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageCircle className="h-4 w-4 text-accent" />
                {selectedParties.length} grupo{selectedParties.length === 1 ? "" : "s"} seleccionado
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Usa {"{guestName}"}, {"{groupName}"} y {"{inviteUrl}"} como variables.
              </p>
            </div>
            {copied && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
                <Copy className="h-3.5 w-3.5" />
                Mensaje copiado para invitados sin teléfono
              </span>
            )}
          </div>
          <textarea
            value={whatsappMessage}
            onChange={(event) => {
              setCopied(false)
              setWhatsappMessage(event.currentTarget.value)
            }}
            rows={3}
            className="mt-3 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-accent"
          />
        </div>
      )}

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
                    <th className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        onClick={toggleVisibleParties}
                        className="rounded border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary"
                      >
                        Sel.
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Grupo</th>
                    <th className="px-4 py-3 font-medium">Invitación</th>
                    <th className="px-4 py-3 font-medium">Asistencia</th>
                    <th className="px-4 py-3 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => (
                    <tr key={g.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedPartyIds.includes(g.partyId)}
                          onChange={() => toggleParty(g.partyId)}
                          aria-label={`Seleccionar invitación de ${g.name}`}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                      </td>
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

function GuestChip({ guest, onDragStart }: { guest: GuestDto; onDragStart: () => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 truncate">{guest.name}</span>
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
