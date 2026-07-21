"use client"

import {
  Eye,
  Globe,
  Loader2,
  MessageCircle,
  Pencil,
  Search,
  Trash2,
  UserRoundCheck,
} from "lucide-react"
import { useMemo, useState, useTransition } from "react"

import type { InvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import { cn } from "@/shared/lib/utils"

type Filter = "todos" | "confirmados" | "pendientes" | "declinados"

const RSVP_STYLES: Record<string, string> = {
  Confirmado: "bg-primary/10 text-primary",
  Declinado: "bg-destructive/10 text-destructive",
  "Sin respuesta": "bg-muted text-muted-foreground",
}

function rsvpSummary(party: InvitationPartyDto) {
  const total = party.guests.length
  const confirmed = party.guests.filter((guest) => guest.rsvp === "Confirmado").length
  const declined = party.guests.filter((guest) => guest.rsvp === "Declinado").length

  if (declined === total) {
    return { label: "Declinado", style: RSVP_STYLES.Declinado }
  }

  if (confirmed === total) {
    return { label: "Confirmado", style: RSVP_STYLES.Confirmado }
  }

  if (confirmed > 0) {
    return {
      label: `${confirmed}/${total} confirmados`,
      style: RSVP_STYLES.Confirmado,
    }
  }

  return { label: "Sin respuesta", style: RSVP_STYLES["Sin respuesta"] }
}

function InvitationActions({
  party,
  onViewDetail,
  onEdit,
  onDelete,
  onSend,
}: {
  party: InvitationPartyDto
  onViewDetail: (party: InvitationPartyDto) => void
  onEdit: (party: InvitationPartyDto) => void
  onDelete: (party: InvitationPartyDto) => Promise<void>
  onSend: (party: InvitationPartyDto) => Promise<void>
}) {
  const [isDeleting, startDelete] = useTransition()
  const [isSending, startSend] = useTransition()
  const canSend = Boolean(party.recipient.phone)

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onViewDetail(party)}
        aria-label={`Ver detalle de ${party.displayName}`}
        title="Ver detalle"
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onEdit(party)}
        aria-label={`Editar ${party.displayName}`}
        title="Editar"
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDelete(() => onDelete(party))}
        aria-label={`Borrar ${party.displayName}`}
        title="Borrar"
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        disabled={!canSend || isSending}
        onClick={() => startSend(() => onSend(party))}
        aria-label={`Enviar por WhatsApp a ${party.displayName}`}
        title={canSend ? "Enviar por WhatsApp" : "Añade teléfono al destinatario"}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        disabled
        aria-label={`Enviar por web a ${party.displayName}`}
        title="Próximamente"
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground opacity-40"
      >
        <Globe className="h-4 w-4" />
      </button>
    </div>
  )
}

function InvitationCard({
  party,
  onViewDetail,
  onEdit,
  onDelete,
  onSend,
}: {
  party: InvitationPartyDto
  onViewDetail: (party: InvitationPartyDto) => void
  onEdit: (party: InvitationPartyDto) => void
  onDelete: (party: InvitationPartyDto) => Promise<void>
  onSend: (party: InvitationPartyDto) => Promise<void>
}) {
  const summary = rsvpSummary(party)

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="font-medium text-foreground">{party.inviteeNames}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {party.guests.map((guest) => (
          <span
            key={guest.id}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
          >
            {guest.name}
            {guest.isRecipient ? (
              <UserRoundCheck className="h-3.5 w-3.5 text-primary" aria-label="Destinatario" />
            ) : null}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{party.group || "—"}</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1",
            party.invite === "Enviada"
              ? "bg-primary/10 text-primary"
              : "bg-accent/15 text-accent",
          )}
        >
          {party.invite}
        </span>
        <span className={cn("rounded-full px-2.5 py-1", summary.style)}>
          {summary.label}
        </span>
      </div>
      <div className="mt-3 border-t border-border/60 pt-3">
        <InvitationActions
          party={party}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          onSend={onSend}
        />
      </div>
    </div>
  )
}

function InvitationRow({
  party,
  onViewDetail,
  onEdit,
  onDelete,
  onSend,
}: {
  party: InvitationPartyDto
  onViewDetail: (party: InvitationPartyDto) => void
  onEdit: (party: InvitationPartyDto) => void
  onDelete: (party: InvitationPartyDto) => Promise<void>
  onSend: (party: InvitationPartyDto) => Promise<void>
}) {
  const summary = rsvpSummary(party)

  return (
    <tr className="border-b border-border/60 align-top last:border-0 hover:bg-secondary/30">
      <td className="px-4 py-4">
        <p className="font-medium text-foreground">{party.inviteeNames}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {party.guests.map((guest) => (
            <span
              key={guest.id}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
            >
              {guest.name}
              {guest.isRecipient ? (
                <UserRoundCheck className="h-3.5 w-3.5 text-primary" aria-label="Destinatario" />
              ) : null}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-4 text-muted-foreground">{party.group || "—"}</td>
      <td className="px-4 py-4">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs",
            party.invite === "Enviada"
              ? "bg-primary/10 text-primary"
              : "bg-accent/15 text-accent",
          )}
        >
          {party.invite}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className={cn("rounded-full px-2.5 py-1 text-xs", summary.style)}>
          {summary.label}
        </span>
      </td>
      <td className="px-4 py-4">
        <InvitationActions
          party={party}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          onSend={onSend}
        />
      </td>
    </tr>
  )
}

export function InvitationsTable({
  parties,
  onViewDetail,
  onEdit,
  onDelete,
  onSend,
}: {
  parties: InvitationPartyDto[]
  onViewDetail: (party: InvitationPartyDto) => void
  onEdit: (party: InvitationPartyDto) => void
  onDelete: (party: InvitationPartyDto) => Promise<void>
  onSend: (party: InvitationPartyDto) => Promise<void>
}) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("todos")

  const filteredParties = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es")

    return parties.filter((party) => {
      const matchesQuery =
        !normalizedQuery ||
        party.inviteeNames.toLocaleLowerCase("es").includes(normalizedQuery) ||
        party.group.toLocaleLowerCase("es").includes(normalizedQuery) ||
        party.recipient.phone?.includes(normalizedQuery) ||
        party.recipient.email?.toLocaleLowerCase("es").includes(normalizedQuery)
      const statuses = party.guests.map((guest) => guest.rsvp)
      const matchesFilter =
        filter === "todos" ||
        (filter === "confirmados" && statuses.includes("Confirmado")) ||
        (filter === "pendientes" && statuses.includes("Sin respuesta")) ||
        (filter === "declinados" && statuses.every((status) => status === "Declinado"))

      return matchesQuery && matchesFilter
    })
  }, [filter, parties, query])

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar invitación o invitado..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["todos", "confirmados", "pendientes", "declinados"] as Filter[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs capitalize transition-colors",
                  filter === item
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                )}
              >
                {item}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 md:hidden">
        {filteredParties.map((party) => (
          <InvitationCard
            key={party.id}
            party={party}
            onViewDetail={onViewDetail}
            onEdit={onEdit}
            onDelete={onDelete}
            onSend={onSend}
          />
        ))}
        {!filteredParties.length ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
            No se encontraron invitaciones.
          </p>
        ) : null}
      </div>

      <div className="mt-3 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Invitación</th>
                <th className="px-4 py-3 font-medium">Grupo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">RSVP</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredParties.map((party) => (
                <InvitationRow
                  key={party.id}
                  party={party}
                  onViewDetail={onViewDetail}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSend={onSend}
                />
              ))}
              {!filteredParties.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron invitaciones.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
