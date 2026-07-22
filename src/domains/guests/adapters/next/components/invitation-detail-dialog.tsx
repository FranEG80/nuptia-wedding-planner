"use client"

import { Dialog } from "@base-ui/react/dialog"
import { Mail, Phone, UserRoundCheck, X } from "lucide-react"

import type { InvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"
import { cn } from "@/shared/lib/utils"

const RSVP_STYLES: Record<string, string> = {
  Confirmado: "bg-primary/10 text-primary",
  Declinado: "bg-destructive/10 text-destructive",
  "Sin respuesta": "bg-muted text-muted-foreground",
}

export function InvitationDetailDialog({
  party,
  onOpenChange,
}: {
  party: InvitationPartyDto | null
  onOpenChange: (open: boolean) => void
}) {
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
                    {party.inviteeNames}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                    {party.group || "Sin grupo asignado"}
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  aria-label="Cerrar"
                  className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Dialog.Close>

                <div className="mt-6 rounded-2xl border border-border bg-background/50 p-4">
                  <h3 className="text-sm font-medium text-foreground">Destinatario</h3>
                  <p className="mt-2 font-medium text-foreground">
                    {party.recipient.name}
                  </p>
                  {party.recipient.phone ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {party.recipient.phone}
                    </p>
                  ) : null}
                  {party.recipient.email ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {party.recipient.email}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3">
                  <h3 className="text-sm font-medium text-foreground">
                    RSVP por invitado
                  </h3>
                  {party.guests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {guest.name}
                        </span>
                        {guest.isRecipient ? (
                          <UserRoundCheck
                            className="h-3.5 w-3.5 text-primary"
                            aria-label="Destinatario"
                          />
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs",
                          RSVP_STYLES[guest.rsvp],
                        )}
                      >
                        {guest.rsvp}
                      </span>
                    </div>
                  ))}
                  {party.guests.some((guest) => guest.notes) ? (
                    <div className="rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                      {party.guests
                        .filter((guest) => guest.notes)
                        .map((guest) => (
                          <p key={guest.id}>
                            <span className="font-medium text-foreground">
                              {guest.firstName}:
                            </span>{" "}
                            {guest.notes}
                          </p>
                        ))}
                    </div>
                  ) : null}
                  {party.messages.length > 0 ? (
                    <div className="rounded-xl border border-border bg-background/50 px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">Comentarios</p>
                      <div className="mt-2 space-y-2 text-muted-foreground">
                        {party.messages.map((message) => (
                          <p key={message.id}>{message.message}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
