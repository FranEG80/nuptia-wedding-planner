"use client"

import { GripVertical } from "lucide-react"

import type { InvitationPartyGuestDto } from "@/domains/guests/application/dtos/invitation-party.dto"

export function GuestChip({
  guest,
  onDragStart,
}: {
  guest: InvitationPartyGuestDto
  onDragStart: () => void
}) {
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
