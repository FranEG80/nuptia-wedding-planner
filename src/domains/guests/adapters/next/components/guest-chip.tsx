"use client"

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react"

import type { InvitationPartyGuestDto } from "@/domains/guests/application/dtos/invitation-party.dto"

interface GuestChipOrder {
  canMoveUp: boolean
  canMoveDown: boolean
  disabled: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}

const ORDER_BUTTON_CLASS =
  "grid h-6 w-6 cursor-pointer place-items-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"

export function GuestChip({
  guest,
  onDragStart,
  order,
}: {
  guest: InvitationPartyGuestDto
  onDragStart: () => void
  // Solo dentro de una mesa: subir/bajar al invitado respecto a sus vecinos.
  order?: GuestChipOrder
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 truncate">{guest.name}</span>
      {order ? (
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={order.onMoveUp}
            disabled={!order.canMoveUp || order.disabled}
            aria-label={`Subir a ${guest.name}`}
            title="Subir invitado"
            className={ORDER_BUTTON_CLASS}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={order.onMoveDown}
            disabled={!order.canMoveDown || order.disabled}
            aria-label={`Bajar a ${guest.name}`}
            title="Bajar invitado"
            className={ORDER_BUTTON_CLASS}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
