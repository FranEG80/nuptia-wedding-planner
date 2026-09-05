"use client"

import { Armchair, LayoutList, Upload, UserPlus } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import {
  useEffect,
  useState,
  useTransition,
  type SetStateAction,
} from "react"

import {
  createInvitationPartyAction,
  deleteInvitationPartyAction,
  getInvitationPartyDetailAction,
  linkInvitationPartyAction,
  listAllInvitationPartiesAction,
  markGuestPartiesInvitedAction,
  respondToInvitationPartyAction,
  updateInvitationPartyAction,
} from "@/domains/guests/adapters/next/actions"
import {
  EMPTY_MEMBER,
  InvitationPartyDialog,
  type PartyMemberDraft,
} from "@/domains/guests/adapters/next/components/invitation-party-dialog"
import { ImportGuestsDialog } from "@/domains/guests/adapters/next/components/import-guests-dialog"
import { InvitationDetailDialog } from "@/domains/guests/adapters/next/components/invitation-detail-dialog"
import {
  ConfirmAttendanceDialog,
  type ConfirmAttendancePayload,
} from "@/domains/guests/adapters/next/components/confirm-attendance-dialog"
import { InvitationsTable } from "@/domains/guests/adapters/next/components/invitations-table"
import { SeatingBoard } from "@/domains/guests/adapters/next/components/seating-board"
import { buildInvitationMessage } from "@/domains/guests/application/build-invitation-message"
import { joinSpanishNames } from "@/domains/guests/application/format-guest-names"
import { normalizePhoneForWhatsapp } from "@/domains/guests/application/normalize-phone"
import type {
  InvitationPartyDto,
  InvitationPartyGuestDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import type { InvitationPartyStatusFilter } from "@/domains/guests/domain/ports/guest.repository"
import { MAX_INVITATION_GUESTS } from "@/domains/guests/domain/invitation-party-limits"
import { useDemoState } from "@/core/demo/use-demo-state"
import { cn } from "@/shared/lib/utils"

export function GuestsView({
  initialParties,
  initialTables,
  initialWhatsappMessage,
  total,
  page,
  pageSize,
  search,
  status,
}: {
  initialParties: InvitationPartyDto[]
  initialTables: TableDto[]
  initialWhatsappMessage: string
  total: number
  page: number
  pageSize: number
  search: string
  status: InvitationPartyStatusFilter
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [parties, setParties, isDemo] = useDemoState("guest-parties", initialParties)
  const [tables, setTables] = useDemoState("guest-tables", initialTables)
  const [tab, setTab] = useState<"lista" | "mesas">("lista")
  const [detailParty, setDetailParty] = useState<InvitationPartyDto | null>(null)
  const [confirmParty, setConfirmParty] = useState<InvitationPartyDto | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [seatingParties, setSeatingParties] = useState<InvitationPartyDto[] | null>(null)
  const [seatingError, setSeatingError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<InvitationPartyDto | null>(null)
  const [groupName, setGroupName] = useState("")
  const [invitationName, setInvitationName] = useState("")
  const [linkedPartyId, setLinkedPartyId] = useState("")
  const [memberDrafts, setMemberDrafts] = useState<PartyMemberDraft[]>([
    { ...EMPTY_MEMBER },
  ])
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  useEffect(() => {
    if (tab !== "mesas" || isDemo || seatingParties !== null) {
      return
    }

    let cancelled = false

    listAllInvitationPartiesAction()
      .then((all) => {
        if (!cancelled) {
          setSeatingParties(all)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSeatingError("No se pudo cargar la lista completa de invitados.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [tab, isDemo, seatingParties])

  function navigate(
    next: {
      page?: number
      search?: string
      status?: InvitationPartyStatusFilter
    },
    mode: "push" | "replace" = "push",
  ) {
    const nextSearch = next.search ?? search
    const nextStatus = next.status ?? status
    const nextPage = next.page ?? page
    const params = new URLSearchParams()

    if (nextSearch.trim()) {
      params.set("q", nextSearch.trim())
    }

    if (nextStatus !== "todos") {
      params.set("estado", nextStatus)
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage))
    }

    const queryString = params.toString()
    router[mode](`${pathname}${queryString ? `?${queryString}` : ""}`)
  }

  function handleSearchChange(value: string) {
    navigate({ search: value, page: 1 }, "replace")
  }

  function handleStatusChange(nextStatus: InvitationPartyStatusFilter) {
    navigate({ status: nextStatus, page: 1 })
  }

  function handlePageChange(nextPage: number) {
    navigate({ page: nextPage })
  }

  function updateSeatingParties(update: SetStateAction<InvitationPartyDto[]>) {
    setSeatingParties((current) => {
      const base = current ?? []
      return typeof update === "function"
        ? (update as (value: InvitationPartyDto[]) => InvitationPartyDto[])(base)
        : update
    })
  }

  function openCreateDialog() {
    setEditingParty(null)
    setGroupName("")
    setInvitationName("")
    setLinkedPartyId("")
    setMemberDrafts([{ ...EMPTY_MEMBER }])
    setFormError(null)
    setDialogOpen(true)
  }

  function openEditDialog(party: InvitationPartyDto) {
    setEditingParty(party)
    setGroupName(party.group)
    setInvitationName(party.invitationName)
    setLinkedPartyId("")
    setMemberDrafts(
      party.guests.map((guest) => ({
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
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
    if (
      memberDrafts.length >= MAX_INVITATION_GUESTS ||
      editingParty?.compositionLocked
    ) {
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

    if (memberDrafts.some((member) => !member.firstName.trim())) {
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

    if (linkedPartyId && memberDrafts.length >= MAX_INVITATION_GUESTS) {
      setFormError(
        `Una invitación conjunta admite como máximo ${MAX_INVITATION_GUESTS} personas.`,
      )
      return
    }

    const guestsInput = memberDrafts.map((member) => ({
      ...(member.id ? { id: member.id } : {}),
      firstName: member.firstName.trim(),
      lastName: member.lastName.trim(),
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
        const name = [draft.firstName, draft.lastName].filter(Boolean).join(" ")

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
            invitedBy: [],
          }),
          id: draft.id ?? crypto.randomUUID(),
          name,
          firstName: draft.firstName,
          lastName: draft.lastName,
          email: draft.email,
          phone: draft.phone,
          isRecipient: draft.isRecipient,
        }
      })
      const recipientGuest = guests.find((guest) => guest.isRecipient)!
      const inviteeNames = joinSpanishNames(guests.map((guest) => guest.name))
      const savedParty: InvitationPartyDto = {
        id: partyId,
        weddingId: "demo",
        inviteToken,
        group: groupName,
        invitationName,
        invite: editingParty?.invite ?? "Pendiente",
        displayName: `Invitación para ${inviteeNames}`,
        inviteeNames,
        recipient: recipientGuest,
        guests,
        messages: [],
        compositionLocked: Boolean(editingParty?.compositionLocked),
      }

      const linkedParty = parties.find((party) => party.id === linkedPartyId)
      const partyToStore = linkedParty
        ? (() => {
            const linkedGuest = linkedParty.guests[0]!
            const guests = [
              ...savedParty.guests,
              {
                ...linkedGuest,
                partyId: savedParty.id,
                role: "companion" as const,
                isRecipient: false,
                group: groupName,
                inviteToken: savedParty.inviteToken,
              },
            ]
            const inviteeNames = joinSpanishNames(guests.map((guest) => guest.name))

            return {
              ...savedParty,
              guests,
              inviteeNames,
              displayName: `Invitación para ${inviteeNames}`,
            }
          })()
        : savedParty

      setParties((current) =>
        current
          .filter((party) => party.id !== linkedParty?.id)
          .map((party) => (party.id === partyToStore.id ? partyToStore : party))
          .concat(
            editingParty || current.some((party) => party.id === partyToStore.id)
              ? []
              : [partyToStore],
          ),
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
              invitationName,
              guests: guestsInput,
            })
          : await createInvitationPartyAction({
              groupName,
              invitationName,
              guests: guestsInput,
            })

        if (!saved) {
          setFormError("No se pudo guardar la invitación.")
          return
        }

        const linked = linkedPartyId
          ? await linkInvitationPartyAction({
              targetPartyId: saved.id,
              sourcePartyId: linkedPartyId,
            })
          : saved

        if (!linked) {
          setFormError("No se pudo vincular la invitación seleccionada.")
          return
        }

        setParties((current) =>
          current
            .filter((party) => party.id !== linkedPartyId)
            .map((party) => (party.id === linked.id ? linked : party))
            .concat(
              editingParty || current.some((party) => party.id === linked.id)
                ? []
                : [linked],
            ),
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

  async function handleViewDetail(party: InvitationPartyDto) {
    if (isDemo) {
      setDetailParty(party)
      return
    }

    const full = await getInvitationPartyDetailAction(party.inviteToken)
    setDetailParty(full ?? party)
  }

  async function handleDeleteParty(party: InvitationPartyDto) {
    if (
      !window.confirm(
        `¿Eliminar la invitación de ${party.inviteeNames}? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }

    setActionError(null)

    if (isDemo) {
      setParties((current) => current.filter((item) => item.id !== party.id))
      return
    }

    const deleted = await deleteInvitationPartyAction(party.id)

    if (deleted) {
      setParties((current) => current.filter((item) => item.id !== party.id))
    } else {
      setActionError("No se pudo eliminar la invitación.")
    }
  }

  async function handleSendWhatsapp(party: InvitationPartyDto) {
    const phone = normalizePhoneForWhatsapp(party.recipient.phone)

    if (!phone) {
      return
    }

    setActionError(null)

    const inviteUrl = `${window.location.origin}/i/${party.inviteToken}`
    const message = buildInvitationMessage(party, initialWhatsappMessage, inviteUrl)

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    )

    if (isDemo) {
      setParties((current) =>
        current.map((item) =>
          item.id === party.id
            ? { ...item, invite: "Enviada", compositionLocked: true }
            : item,
        ),
      )
      return
    }

    try {
      const ok = await markGuestPartiesInvitedAction([party.id])

      if (ok) {
        setParties((current) =>
          current.map((item) =>
            item.id === party.id
              ? { ...item, invite: "Enviada", compositionLocked: true }
              : item,
          ),
        )
      } else {
        setActionError("No se pudo marcar la invitación como enviada.")
      }
    } catch {
      setActionError("No se pudo marcar la invitación como enviada.")
    }
  }

  async function handleConfirmAttendance(
    party: InvitationPartyDto,
    payload: ConfirmAttendancePayload,
  ): Promise<boolean> {
    if (isDemo) {
      setParties((current) =>
        current.map((item) => {
          if (item.id !== party.id) {
            return item
          }

          return {
            ...item,
            guests: item.guests.map((guest) => {
              const response = payload.guests.find((g) => g.guestId === guest.id)

              if (!response) {
                return guest
              }

              return {
                ...guest,
                rsvp: response.attending ? "Confirmado" : "Declinado",
                notes: response.notes,
              }
            }),
          }
        }),
      )
      return true
    }

    try {
      const updated = await respondToInvitationPartyAction({
        token: party.inviteToken,
        guests: payload.guests,
        message: payload.message,
      })

      if (!updated) {
        return false
      }

      setParties((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      return true
    } catch {
      return false
    }
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
        {tab === "lista" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setImportDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
            >
              <Upload className="h-4 w-4" />
              Importar
            </button>
            <button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
            >
              <UserPlus className="h-4 w-4" />
              Nueva invitación
            </button>
          </div>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {tab === "lista" ? (
        <InvitationsTable
          parties={parties}
          onViewDetail={handleViewDetail}
          onEdit={openEditDialog}
          onDelete={handleDeleteParty}
          onSend={handleSendWhatsapp}
          onConfirmAttendance={setConfirmParty}
          search={search}
          onSearchChange={handleSearchChange}
          status={status}
          onStatusChange={handleStatusChange}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={handlePageChange}
        />
      ) : isDemo ? (
        <SeatingBoard
          parties={parties}
          setParties={setParties}
          tables={tables}
          setTables={setTables}
          isDemo={isDemo}
        />
      ) : seatingParties === null ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          {seatingError ?? "Cargando distribución de mesas…"}
        </p>
      ) : (
        <SeatingBoard
          parties={seatingParties}
          setParties={updateSeatingParties}
          tables={tables}
          setTables={setTables}
          isDemo={isDemo}
        />
      )}

      <InvitationPartyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingParty={editingParty}
        groupName={groupName}
        onGroupNameChange={setGroupName}
        invitationName={invitationName}
        onInvitationNameChange={setInvitationName}
        linkableParties={parties.filter(
          (party) =>
            party.id !== editingParty?.id &&
            party.guests.length === 1 &&
            !party.compositionLocked,
        )}
        linkedPartyId={linkedPartyId}
        onLinkedPartyChange={setLinkedPartyId}
        members={memberDrafts}
        onMemberChange={updateMember}
        onSelectRecipient={selectRecipient}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        onSave={saveParty}
        error={formError}
        saving={isSaving}
      />

      <InvitationDetailDialog
        party={detailParty}
        onOpenChange={(open) => {
          if (!open) {
            setDetailParty(null)
          }
        }}
      />

      <ConfirmAttendanceDialog
        party={confirmParty}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmParty(null)
          }
        }}
        onSubmit={handleConfirmAttendance}
      />

      <ImportGuestsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        parties={parties}
        isDemo={isDemo}
        onImported={(result) => {
          if (result.parties.length === 0) {
            return
          }
          setParties((current) => {
            const byId = new Map(current.map((party) => [party.id, party]))

            for (const party of result.parties) {
              byId.set(party.id, party)
            }

            return [...byId.values()]
          })
        }}
      />
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
  icon: typeof LayoutList
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
