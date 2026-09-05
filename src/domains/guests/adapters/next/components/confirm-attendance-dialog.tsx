"use client"

import { Dialog } from "@base-ui/react/dialog"
import { Loader2, X } from "lucide-react"
import { useState, useTransition } from "react"

import type { InvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"

export interface ConfirmAttendancePayload {
  guests: Array<{ guestId: string; attending: boolean; notes: string }>
  message: string | null
}

type Draft = Record<string, { attending: boolean; notes: string }>

function buildInitialDrafts(party: InvitationPartyDto): Draft {
  return Object.fromEntries(
    party.guests.map((guest) => [
      guest.id,
      { attending: guest.rsvp !== "Declinado", notes: guest.notes ?? "" },
    ]),
  )
}

export function ConfirmAttendanceDialog({
  party,
  onOpenChange,
  onSubmit,
}: {
  party: InvitationPartyDto | null
  onOpenChange: (open: boolean) => void
  onSubmit: (
    party: InvitationPartyDto,
    payload: ConfirmAttendancePayload,
  ) => Promise<boolean>
}) {
  const [drafts, setDrafts] = useState<Draft>({})
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  const isOpen = Boolean(party)
  const [wasOpen, setWasOpen] = useState(isOpen)

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)

    if (isOpen && party) {
      setDrafts(buildInitialDrafts(party))
      setMessage("")
      setError(null)
    }
  }

  function toggleAttending(guestId: string) {
    setDrafts((current) => ({
      ...current,
      [guestId]: {
        ...current[guestId],
        attending: !current[guestId]?.attending,
      },
    }))
  }

  function updateNotes(guestId: string, notes: string) {
    setDrafts((current) => ({
      ...current,
      [guestId]: { ...current[guestId], notes },
    }))
  }

  function handleSubmit() {
    if (!party) {
      return
    }

    setError(null)

    const payload: ConfirmAttendancePayload = {
      guests: party.guests.map((guest) => {
        const draft = drafts[guest.id]

        return {
          guestId: guest.id,
          attending: draft?.attending ?? true,
          notes: draft?.attending ? draft.notes.trim() : "",
        }
      }),
      message: message.trim() || null,
    }

    startSaving(async () => {
      const ok = await onSubmit(party, payload)

      if (ok) {
        onOpenChange(false)
      } else {
        setError("No se pudo guardar la respuesta.")
      }
    })
  }

  return (
    <Dialog.Root open={Boolean(party)} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <Dialog.Popup className="relative my-auto w-full max-w-lg rounded-3xl border border-border bg-card p-5 text-foreground shadow-2xl outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
            {party ? (
              <>
                <div className="pr-12">
                  <Dialog.Title className="font-serif text-2xl">
                    Confirmar asistencia
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                    Rellena la respuesta en nombre de {party.inviteeNames}.
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  aria-label="Cerrar"
                  className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Dialog.Close>

                <div className="mt-6 grid max-h-[50vh] gap-3 overflow-y-auto pr-1">
                  {party.guests.map((guest) => {
                    const draft = drafts[guest.id]

                    return (
                      <div
                        key={guest.id}
                        className="rounded-2xl border border-border bg-background/50 p-4"
                      >
                        <label className="flex cursor-pointer items-center justify-between gap-3">
                          <span className="font-medium text-foreground">
                            {guest.name}
                          </span>
                          <input
                            type="checkbox"
                            checked={draft?.attending ?? true}
                            onChange={() => toggleAttending(guest.id)}
                            className="h-5 w-5 accent-primary"
                            aria-label={`Asistirá ${guest.name}`}
                          />
                        </label>
                        {draft?.attending ? (
                          <textarea
                            value={draft?.notes ?? ""}
                            onChange={(event) =>
                              updateNotes(guest.id, event.target.value)
                            }
                            placeholder="Alergias, notas..."
                            rows={2}
                            className="mt-3 w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
                          />
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <label className="mt-4 grid gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Mensaje (opcional)
                  </span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Mensaje de parte del invitado..."
                    rows={3}
                    className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </label>

                {error ? (
                  <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                <div className="mt-6 flex justify-end gap-2">
                  <Dialog.Close className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/50">
                    Cancelar
                  </Dialog.Close>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Guardar respuesta
                  </button>
                </div>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
