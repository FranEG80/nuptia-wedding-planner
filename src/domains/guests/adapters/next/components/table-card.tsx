"use client"

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { useState } from "react"

import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import type { InvitationPartyGuestDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import { GuestChip } from "@/domains/guests/adapters/next/components/guest-chip"
import { cn } from "@/shared/lib/utils"

function occupancyBadge(seatedCount: number, capacity: number | null) {
  if (seatedCount === 0) {
    return { label: "Vacía", style: "bg-muted text-muted-foreground" }
  }

  if (capacity != null && seatedCount >= capacity) {
    return { label: "Completa", style: "bg-primary/10 text-primary" }
  }

  return {
    label: capacity != null ? `${seatedCount}/${capacity}` : `${seatedCount}`,
    style: "bg-accent/15 text-accent",
  }
}

export function TableCard({
  table,
  seated,
  dragId,
  onDragStart,
  onDrop,
  canMoveDown,
  canMoveUp,
  isMoving,
  onMoveDown,
  onMoveUp,
  isMovingGuest,
  onMoveGuest,
  onEdit,
  onDelete,
}: {
  table: TableDto
  seated: InvitationPartyGuestDto[]
  dragId: string | null
  onDragStart: (guestId: string) => void
  onDrop: () => void
  canMoveDown: boolean
  canMoveUp: boolean
  isMoving: boolean
  onMoveDown: () => void
  onMoveUp: () => void
  isMovingGuest: boolean
  onMoveGuest: (guestId: string, direction: "up" | "down") => void
  onEdit: (table: TableDto) => void
  onDelete: (table: TableDto) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const badge = occupancyBadge(seated.length, table.capacity)

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => dragId && onDrop()}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">
            {table.sortOrder}
          </span>
          <span className="truncate font-serif text-lg text-foreground">{table.name}</span>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs", badge.style)}>
          {badge.label}
        </span>
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp || isMoving}
            aria-label={`Subir ${table.name}`}
            title="Subir mesa"
            className="grid h-5 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown || isMoving}
            aria-label={`Bajar ${table.name}`}
            title="Bajar mesa"
            className="grid h-5 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(table)}
            aria-label={`Editar ${table.name}`}
            title="Editar mesa"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(table)}
            aria-label={`Borrar ${table.name}`}
            title="Borrar mesa"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {table.phrase ? (
        <p className="mt-2 line-clamp-2 pl-10 font-serif text-sm italic text-muted-foreground">
          “{table.phrase}”
        </p>
      ) : null}
      {!collapsed ? (
        <div className="mt-3 min-h-20 space-y-2">
          {seated.map((guest, index) => (
            <GuestChip
              key={guest.id}
              guest={guest}
              onDragStart={() => onDragStart(guest.id)}
              order={{
                canMoveUp: index > 0,
                canMoveDown: index < seated.length - 1,
                disabled: isMovingGuest,
                onMoveUp: () => onMoveGuest(guest.id, "up"),
                onMoveDown: () => onMoveGuest(guest.id, "down"),
              }}
            />
          ))}
          {!seated.length ? (
            <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Suelta invitados aquí
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
