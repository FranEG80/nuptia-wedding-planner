"use client"

import { Dialog } from "@base-ui/react/dialog"
import { LockKeyhole, Plus, X } from "lucide-react"

import type { InvitationPartyDto } from "@/domains/guests/application/dtos/invitation-party.dto"

export interface PartyMemberDraft {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  isRecipient: boolean
}

export const EMPTY_MEMBER: PartyMemberDraft = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  isRecipient: true,
}

export function InvitationPartyDialog({
  open,
  onOpenChange,
  editingParty,
  groupName,
  onGroupNameChange,
  members,
  onMemberChange,
  onSelectRecipient,
  onAddMember,
  onRemoveMember,
  onSave,
  error,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingParty: InvitationPartyDto | null
  groupName: string
  onGroupNameChange: (value: string) => void
  members: PartyMemberDraft[]
  onMemberChange: (index: number, patch: Partial<PartyMemberDraft>) => void
  onSelectRecipient: (index: number) => void
  onAddMember: () => void
  onRemoveMember: (index: number) => void
  onSave: () => void
  error: string | null
  saving: boolean
}) {
  const compositionLocked = Boolean(editingParty?.compositionLocked)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
          <Dialog.Popup className="relative my-auto w-full max-w-2xl rounded-3xl border border-border bg-card p-5 text-foreground shadow-2xl outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
            <div className="pr-12">
              <Dialog.Title className="font-serif text-2xl">
                {editingParty ? "Editar invitación" : "Nueva invitación"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                Añade una o dos personas y elige quién recibirá el enlace.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>

            {compositionLocked ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-foreground">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>
                  La invitación ya fue enviada o respondida. Puedes corregir datos y
                  cambiar el destinatario, pero no añadir ni retirar personas.
                </p>
              </div>
            ) : null}

            <label className="mt-6 grid gap-2 text-sm font-medium">
              Grupo interno
              <input
                value={groupName}
                onChange={(event) => onGroupNameChange(event.target.value)}
                placeholder="Familia, amigos, trabajo..."
                className="h-11 rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
              />
            </label>

            <div className="mt-5 grid gap-4">
              {members.map((member, index) => (
                <fieldset
                  key={member.id ?? `new-${index}`}
                  className="rounded-2xl border border-border bg-background/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <legend className="font-medium">
                      {members.length === 1 ? "Invitado" : `Invitado ${index + 1}`}
                    </legend>
                    {!compositionLocked && members.length === 2 ? (
                      <button
                        type="button"
                        onClick={() => onRemoveMember(index)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Retirar
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      Nombre
                      <input
                        value={member.firstName}
                        onChange={(event) =>
                          onMemberChange(index, { firstName: event.target.value })
                        }
                        className="h-11 rounded-xl border border-border bg-card px-3 outline-none focus:border-accent"
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      Apellidos
                      <input
                        value={member.lastName}
                        onChange={(event) =>
                          onMemberChange(index, { lastName: event.target.value })
                        }
                        className="h-11 rounded-xl border border-border bg-card px-3 outline-none focus:border-accent"
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      Teléfono
                      <input
                        type="tel"
                        value={member.phone}
                        onChange={(event) =>
                          onMemberChange(index, { phone: event.target.value })
                        }
                        className="h-11 rounded-xl border border-border bg-card px-3 outline-none focus:border-accent"
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      Email
                      <input
                        type="email"
                        value={member.email}
                        onChange={(event) =>
                          onMemberChange(index, { email: event.target.value })
                        }
                        className="h-11 rounded-xl border border-border bg-card px-3 outline-none focus:border-accent"
                      />
                    </label>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
                    <input
                      type="radio"
                      name="party-recipient"
                      checked={member.isRecipient}
                      onChange={() => onSelectRecipient(index)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>
                      <span className="block font-medium">Recibirá la invitación</span>
                      <span className="text-xs text-muted-foreground">
                        WhatsApp se abrirá solamente para esta persona.
                      </span>
                    </span>
                  </label>
                </fieldset>
              ))}
            </div>

            {!compositionLocked && members.length === 1 ? (
              <button
                type="button"
                onClick={onAddMember}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-accent hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Añadir segunda persona
              </button>
            ) : null}

            {error ? (
              <p
                className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary">
                Cancelar
              </Dialog.Close>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar invitación"}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
