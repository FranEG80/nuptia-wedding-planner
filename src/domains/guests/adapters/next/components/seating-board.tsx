"use client"

import { Download, Plus, Users } from "lucide-react"
import { useMemo, useState, type Dispatch, type SetStateAction } from "react"

import {
  assignGuestSeatAction,
  createTableAction,
  deleteTableAction,
  unassignGuestSeatAction,
} from "@/domains/guests/adapters/next/table-actions"
import { AddTableDialog } from "@/domains/guests/adapters/next/components/add-table-dialog"
import { GuestChip } from "@/domains/guests/adapters/next/components/guest-chip"
import { TableCard } from "@/domains/guests/adapters/next/components/table-card"
import { exportSeatingPdf } from "@/domains/guests/adapters/next/components/export-seating-pdf"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import type { InvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"

export function SeatingBoard({
  parties,
  setParties,
  tables,
  setTables,
  isDemo,
}: {
  parties: InvitationPartyDto[]
  setParties: Dispatch<SetStateAction<InvitationPartyDto[]>>
  tables: TableDto[]
  setTables: Dispatch<SetStateAction<TableDto[]>>
  isDemo: boolean
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [addTableOpen, setAddTableOpen] = useState(false)
  const [seatError, setSeatError] = useState<string | null>(null)

  const guests = useMemo(() => parties.flatMap((party) => party.guests), [parties])
  const confirmed = guests.filter((guest) => guest.rsvp === "Confirmado")
  const unassigned = confirmed.filter((guest) => !guest.seat)

  function updateGuestSeat(
    guestId: string,
    seat: InvitationPartyDto["guests"][number]["seat"],
  ) {
    setParties((current) =>
      current.map((party) => ({
        ...party,
        guests: party.guests.map((guest) =>
          guest.id === guestId ? { ...guest, seat } : guest,
        ),
      })),
    )
  }

  async function assignTable(guestId: string, tableId: string | null) {
    const previousSeat = guests.find((guest) => guest.id === guestId)?.seat ?? null

    if (previousSeat?.tableId === tableId) {
      return
    }

    const table = tableId ? tables.find((item) => item.id === tableId) : null
    const optimisticSeat = tableId
      ? { id: `optimistic-${guestId}`, tableId, tableName: table?.name ?? tableId, position: 0 }
      : null

    updateGuestSeat(guestId, optimisticSeat)
    setSeatError(null)

    if (isDemo) {
      return
    }

    try {
      const updated = tableId
        ? await assignGuestSeatAction(guestId, tableId)
        : await unassignGuestSeatAction(guestId)

      if (updated) {
        updateGuestSeat(guestId, updated.seat)
      } else {
        updateGuestSeat(guestId, previousSeat)
        setSeatError("No se pudo actualizar la mesa del invitado.")
      }
    } catch {
      updateGuestSeat(guestId, previousSeat)
      setSeatError("No se pudo actualizar la mesa del invitado.")
    }
  }

  async function handleAddTable(input: { name?: string; capacity?: number | null }) {
    if (isDemo) {
      const nextSortOrder = (tables.at(-1)?.sortOrder ?? 0) + 1
      setTables((current) => [
        ...current,
        {
          id: `demo-table-${crypto.randomUUID()}`,
          weddingId: "demo",
          name: input.name?.trim() || `Mesa ${nextSortOrder}`,
          sortOrder: nextSortOrder,
          capacity: input.capacity ?? null,
        },
      ])
      return
    }

    const table = await createTableAction(input)

    if (table) {
      setTables((current) => [...current, table])
    }
  }

  async function handleDeleteTable(table: TableDto) {
    const seatedCount = confirmed.filter((guest) => guest.seat?.tableId === table.id).length

    if (
      seatedCount > 0 &&
      !window.confirm(
        `${table.name} tiene ${seatedCount} invitado${seatedCount === 1 ? "" : "s"}. Se moverán a "Sin asignar". ¿Borrar la mesa de todas formas?`,
      )
    ) {
      return
    }

    if (isDemo) {
      setTables((current) => current.filter((item) => item.id !== table.id))
      setParties((current) =>
        current.map((party) => ({
          ...party,
          guests: party.guests.map((guest) =>
            guest.seat?.tableId === table.id ? { ...guest, seat: null } : guest,
          ),
        })),
      )
      return
    }

    const deleted = await deleteTableAction(table.id)

    if (deleted) {
      setTables((current) => current.filter((item) => item.id !== table.id))
      setParties((current) =>
        current.map((party) => ({
          ...party,
          guests: party.guests.map((guest) =>
            guest.seat?.tableId === table.id ? { ...guest, seat: null } : guest,
          ),
        })),
      )
    }
  }

  function handleExportPdf() {
    void exportSeatingPdf(tables, confirmed)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleExportPdf}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
        >
          <Download className="h-4 w-4" />
          Exportar PDF
        </button>
        <button
          type="button"
          onClick={() => setAddTableOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Añadir mesa
        </button>
      </div>

      {seatError ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {seatError}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="flex max-h-[70vh] flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex shrink-0 items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <h3 className="font-serif text-lg text-foreground">Sin asignar</h3>
          </div>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dragId && assignTable(dragId, null)}
            className="min-h-24 flex-1 space-y-2 overflow-y-auto"
          >
            {unassigned.map((guest) => (
              <GuestChip key={guest.id} guest={guest} onDragStart={() => setDragId(guest.id)} />
            ))}
            {!unassigned.length ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Todos los invitados tienen mesa.
              </p>
            ) : null}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                seated={confirmed.filter((guest) => guest.seat?.tableId === table.id)}
                dragId={dragId}
                onDragStart={setDragId}
                onDrop={() => assignTable(dragId!, table.id)}
                onDelete={handleDeleteTable}
              />
            ))}
            {!tables.length ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                Aún no hay mesas. Añade la primera para empezar a distribuir invitados.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <AddTableDialog
        open={addTableOpen}
        onOpenChange={setAddTableOpen}
        onCreate={handleAddTable}
      />
    </div>
  )
}
