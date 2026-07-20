"use client"

import { Dialog } from "@base-ui/react/dialog"
import {
  Armchair,
  GripVertical,
  LayoutList,
  LockKeyhole,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Send,
  UserPlus,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react"
import { useMemo, useState, useTransition } from "react"

import {
  createInvitationPartyAction,
  markGuestPartiesInvitedAction,
  updateInvitationPartyAction,
} from "@/domains/guests/adapters/next/actions"
import type { GuestDto } from "@/domains/guests/application/dtos/guest.dto"
import type {
  InvitationPartyDto,
  InvitationPartyGuestDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import { useDemoState } from "@/core/demo/use-demo-state"
import { cn } from "@/shared/lib/utils"

type Filter = "todos" | "confirmados" | "pendientes" | "declinados"
type RsvpStatus = GuestDto["rsvp"]

interface PartyMemberDraft {
  id?: string
  name: string
  email: string
  phone: string
  isRecipient: boolean
}

const RSVP_STYLES: Record<RsvpStatus, string> = {
  Confirmado: "bg-primary/10 text-primary",
  Declinado: "bg-destructive/10 text-destructive",
  "Sin respuesta": "bg-muted text-muted-foreground",
}

const EMPTY_MEMBER: PartyMemberDraft = {
  name: "",
  email: "",
  phone: "",
  isRecipient: true,
}

export function GuestsView({
  initialParties,
  initialWhatsappMessage,
}: {
  initialParties: InvitationPartyDto[]
  initialWhatsappMessage: string
}) {
  const [parties, setParties, isDemo] = useDemoState("guest-parties", initialParties)
  const [tab, setTab] = useState<"lista" | "mesas">("lista")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("todos")
  const [dragId, setDragId] = useState<string | null>(null)
  const [selectedPartyIds, setSelectedPartyIds] = useState<string[]>([])
  const [whatsappMessage, setWhatsappMessage] = useState(initialWhatsappMessage)
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, startSending] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<InvitationPartyDto | null>(null)
  const [groupName, setGroupName] = useState("")
  const [memberDrafts, setMemberDrafts] = useState<PartyMemberDraft[]>([
    { ...EMPTY_MEMBER },
  ])
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  const guests = useMemo(
    () => parties.flatMap((party) => party.guests),
    [parties],
  )
  const confirmed = guests.filter((guest) => guest.rsvp === "Confirmado")
  const tables = [1, 2, 3, 4]
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
  const selectedParties = parties.filter((party) =>
    selectedPartyIds.includes(party.id),
  )

  function assignTable(guestId: string, table: number | null) {
    setParties((current) =>
      current.map((party) => ({
        ...party,
        guests: party.guests.map((guest) =>
          guest.id === guestId ? { ...guest, table } : guest,
        ),
      })),
    )
  }

  function toggleParty(party: InvitationPartyDto) {
    if (!party.recipient.phone) {
      return
    }

    setSelectedPartyIds((current) =>
      current.includes(party.id)
        ? current.filter((id) => id !== party.id)
        : [...current, party.id],
    )
  }

  function toggleVisibleParties() {
    const visibleIds = filteredParties
      .filter((party) => party.recipient.phone)
      .map((party) => party.id)
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((partyId) => selectedPartyIds.includes(partyId))

    setSelectedPartyIds((current) =>
      allVisibleSelected
        ? current.filter((partyId) => !visibleIds.includes(partyId))
        : Array.from(new Set([...current, ...visibleIds])),
    )
  }

  function invitationMessage(party: InvitationPartyDto) {
    const inviteUrl = `${window.location.origin}/i/${party.inviteToken}`

    return whatsappMessage
      .replaceAll("{guestName}", party.recipient.name)
      .replaceAll("{inviteeNames}", party.inviteeNames)
      .replaceAll("{groupName}", party.group || party.inviteeNames)
      .replaceAll("{inviteUrl}", inviteUrl)
  }

  function sendSelectedInvitations() {
    if (!selectedParties.length) {
      return
    }

    setSendError(null)

    for (const party of selectedParties) {
      const phone = party.recipient.phone?.replace(/[^\d]/g, "")

      if (!phone) {
        continue
      }

      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(invitationMessage(party))}`,
        "_blank",
        "noopener,noreferrer",
      )
    }

    if (isDemo) {
      const selectedIds = new Set(selectedParties.map((party) => party.id))
      setParties((current) =>
        current.map((party) =>
          selectedIds.has(party.id)
            ? { ...party, invite: "Enviada", compositionLocked: true }
            : party,
        ),
      )
      setSelectedPartyIds([])
      return
    }

    startSending(async () => {
      try {
        const nextParties = await markGuestPartiesInvitedAction(
          selectedParties.map((party) => party.id),
        )
        setParties(nextParties)
        setSelectedPartyIds([])
      } catch {
        setSendError("No se pudieron marcar las invitaciones como enviadas.")
      }
    })
  }

  function openCreateDialog() {
    setEditingParty(null)
    setGroupName("")
    setMemberDrafts([{ ...EMPTY_MEMBER }])
    setFormError(null)
    setDialogOpen(true)
  }

  function openEditDialog(party: InvitationPartyDto) {
    setEditingParty(party)
    setGroupName(party.group)
    setMemberDrafts(
      party.guests.map((guest) => ({
        id: guest.id,
        name: guest.name,
        email: guest.email ?? "",
        phone: guest.phone ?? "",
        isRecipient: guest.isRecipient,
      })),
    )
    setFormError(null)
    setDialogOpen(true)
  }

  function updateMember(index: number, patch: Partial<PartyMemberDraft>) {
    setMemberDrafts((current) =>
      current.map((member, memberIndex) =>
        memberIndex === index ? { ...member, ...patch } : member,
      ),
    )
    setFormError(null)
  }

  function selectRecipient(index: number) {
    setMemberDrafts((current) =>
      current.map((member, memberIndex) => ({
        ...member,
        isRecipient: memberIndex === index,
      })),
    )
  }

  function addMember() {
    if (memberDrafts.length === 2 || editingParty?.compositionLocked) {
      return
    }

    setMemberDrafts((current) => [
      ...current,
      { ...EMPTY_MEMBER, isRecipient: false },
    ])
  }

  function removeMember(index: number) {
    if (memberDrafts.length === 1 || editingParty?.compositionLocked) {
      return
    }

    setMemberDrafts((current) => {
      const removedRecipient = current[index]?.isRecipient
      const next = current.filter((_, memberIndex) => memberIndex !== index)

      return removedRecipient
        ? next.map((member, memberIndex) => ({
            ...member,
            isRecipient: memberIndex === 0,
          }))
        : next
    })
  }

  function saveParty() {
    const recipient = memberDrafts.find((member) => member.isRecipient)

    if (memberDrafts.some((member) => !member.name.trim())) {
      setFormError("Escribe el nombre de cada invitado.")
      return
    }

    if (!recipient) {
      setFormError("Selecciona quién recibirá la invitación.")
      return
    }

    if (!recipient.phone.trim() && !recipient.email.trim()) {
      setFormError("El destinatario necesita teléfono o email.")
      return
    }

    const guestsInput = memberDrafts.map((member) => ({
      ...(member.id ? { id: member.id } : {}),
      name: member.name.trim(),
      email: member.email.trim() || null,
      phone: member.phone.trim() || null,
      isRecipient: member.isRecipient,
    }))

    if (isDemo) {
      const partyId = editingParty?.id ?? crypto.randomUUID()
      const inviteToken = editingParty?.inviteToken ?? crypto.randomUUID()
      const existingGuestsById = new Map(
        (editingParty?.guests ?? []).map((guest) => [guest.id, guest]),
      )

      const guests: InvitationPartyGuestDto[] = guestsInput.map((draft) => {
        const existing = draft.id ? existingGuestsById.get(draft.id) : undefined

        return {
          ...(existing ?? {
            partyId,
            weddingId: "demo",
            appUserId: null,
            role: draft.isRecipient ? "primary" : "companion",
            group: groupName,
            invite: "Pendiente",
            rsvp: "Sin respuesta",
            notes: "",
            inviteToken,
            uploadToken: null,
            seat: null,
            table: null,
            invitedBy: [],
          }),
          id: draft.id ?? crypto.randomUUID(),
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          isRecipient: draft.isRecipient,
        }
      })
      const recipient = guests.find((guest) => guest.isRecipient)!
      const inviteeNames = guests.map((guest) => guest.name).join(" y ")
      const savedParty: InvitationPartyDto = {
        id: partyId,
        weddingId: "demo",
        inviteToken,
        group: groupName,
        invite: editingParty?.invite ?? "Pendiente",
        displayName: `Invitación para ${inviteeNames}`,
        inviteeNames,
        recipient,
        guests,
        compositionLocked: Boolean(editingParty?.compositionLocked),
      }

      setParties((current) =>
        editingParty
          ? current.map((party) => (party.id === savedParty.id ? savedParty : party))
          : [...current, savedParty],
      )
      setDialogOpen(false)
      return
    }

    startSaving(async () => {
      try {
        const saved = editingParty
          ? await updateInvitationPartyAction({
              partyId: editingParty.id,
              groupName,
              guests: guestsInput,
            })
          : await createInvitationPartyAction({
              groupName,
              guests: guestsInput,
            })

        if (!saved) {
          setFormError("No se pudo guardar la invitación.")
          return
        }

        setParties((current) =>
          editingParty
            ? current.map((party) => (party.id === saved.id ? saved : party))
            : [...current, saved],
        )
        setDialogOpen(false)
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la invitación.",
        )
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          <TabButton
            active={tab === "lista"}
            onClick={() => setTab("lista")}
            icon={LayoutList}
          >
            Invitaciones
          </TabButton>
          <TabButton
            active={tab === "mesas"}
            onClick={() => setTab("mesas")}
            icon={Armchair}
          >
            Distribución de mesas
          </TabButton>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreateDialog}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
          >
            <UserPlus className="h-4 w-4" />
            Nueva invitación
          </button>
          <button
            type="button"
            onClick={sendSelectedInvitations}
            disabled={!selectedParties.length || isSending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSending ? "Marcando..." : "Enviar por WhatsApp"}
          </button>
        </div>
      </div>

      {selectedParties.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircle className="h-4 w-4 text-accent" />
              {selectedParties.length} invitación
              {selectedParties.length === 1 ? "" : "es"} seleccionada
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Variables: {"{guestName}"} es el destinatario y {"{inviteeNames}"}
              incluye a las dos personas.
            </p>
          </div>
          <textarea
            value={whatsappMessage}
            onChange={(event) => setWhatsappMessage(event.currentTarget.value)}
            rows={3}
            className="mt-3 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-accent"
          />
        </div>
      ) : null}

      {sendError ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {sendError}
        </p>
      ) : null}

      {tab === "lista" ? (
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

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        onClick={toggleVisibleParties}
                        className="rounded border border-border bg-card px-2 py-1 text-[11px] hover:bg-secondary"
                      >
                        Sel.
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">Invitación</th>
                    <th className="px-4 py-3 font-medium">Grupo</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">RSVP individual</th>
                    <th className="px-4 py-3 font-medium">Destinatario</th>
                    <th className="px-4 py-3 font-medium">Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParties.map((party) => (
                    <tr
                      key={party.id}
                      className="border-b border-border/60 align-top last:border-0 hover:bg-secondary/30"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPartyIds.includes(party.id)}
                          disabled={!party.recipient.phone}
                          onChange={() => toggleParty(party)}
                          aria-label={`Seleccionar ${party.displayName}`}
                          title={
                            party.recipient.phone
                              ? "Seleccionar para WhatsApp"
                              : "Añade teléfono al destinatario para usar WhatsApp"
                          }
                          className="h-4 w-4 rounded border-border accent-primary disabled:cursor-not-allowed disabled:opacity-35"
                        />
                      </td>
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
                                <UserRoundCheck
                                  className="h-3.5 w-3.5 text-primary"
                                  aria-label="Destinatario"
                                />
                              ) : null}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {party.group || "—"}
                      </td>
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
                        <div className="grid gap-2">
                          {party.guests.map((guest) => (
                            <div key={guest.id} className="flex items-center gap-2">
                              <span className="max-w-28 truncate text-xs text-muted-foreground">
                                {guest.name}
                              </span>
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
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <p className="font-medium text-foreground">{party.recipient.name}</p>
                        {party.recipient.phone ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xs">
                            <Phone className="h-3.5 w-3.5" />
                            {party.recipient.phone}
                          </p>
                        ) : null}
                        {party.recipient.email ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xs">
                            <Mail className="h-3.5 w-3.5" />
                            {party.recipient.email}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openEditDialog(party)}
                          aria-label={`Editar ${party.displayName}`}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredParties.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        No se encontraron invitaciones.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h3 className="font-serif text-lg text-foreground">Sin asignar</h3>
            </div>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dragId && assignTable(dragId, null)}
              className="min-h-24 space-y-2"
            >
              {confirmed
                .filter((guest) => guest.table === null)
                .map((guest) => (
                  <GuestChip
                    key={guest.id}
                    guest={guest}
                    onDragStart={() => setDragId(guest.id)}
                  />
                ))}
              {!confirmed.some((guest) => guest.table === null) ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Todos los invitados tienen mesa.
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tables.map((table) => {
              const seated = confirmed.filter((guest) => guest.table === table)

              return (
                <div
                  key={table}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dragId && assignTable(dragId, table)}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-serif text-lg text-foreground">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">
                        {table}
                      </span>
                      Mesa {table}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {seated.length}/8
                    </span>
                  </div>
                  <div className="min-h-20 space-y-2">
                    {seated.map((guest) => (
                      <GuestChip
                        key={guest.id}
                        guest={guest}
                        onDragStart={() => setDragId(guest.id)}
                      />
                    ))}
                    {!seated.length ? (
                      <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Suelta invitados aquí
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <InvitationPartyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingParty={editingParty}
        groupName={groupName}
        onGroupNameChange={setGroupName}
        members={memberDrafts}
        onMemberChange={updateMember}
        onSelectRecipient={selectRecipient}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        onSave={saveParty}
        error={formError}
        saving={isSaving}
      />
    </div>
  )
}

function InvitationPartyDialog({
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
                  <label className="mt-3 grid gap-2 text-sm">
                    Nombre completo
                    <input
                      value={member.name}
                      onChange={(event) =>
                        onMemberChange(index, { name: event.target.value })
                      }
                      className="h-11 rounded-xl border border-border bg-card px-3 outline-none focus:border-accent"
                    />
                  </label>
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

function GuestChip({
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
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}
