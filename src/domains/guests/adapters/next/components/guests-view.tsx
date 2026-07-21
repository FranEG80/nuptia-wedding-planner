"use client"

import { Armchair, LayoutList, Upload, UserPlus } from "lucide-react"
import { useState, useTransition } from "react"

import {
  createInvitationPartyAction,
  deleteInvitationPartyAction,
  markGuestPartiesInvitedAction,
  updateInvitationPartyAction,
} from "@/domains/guests/adapters/next/actions"
import {
  EMPTY_MEMBER,
  InvitationPartyDialog,
  type PartyMemberDraft,
} from "@/domains/guests/adapters/next/components/invitation-party-dialog"
import { ImportGuestsDialog } from "@/domains/guests/adapters/next/components/import-guests-dialog"
import { InvitationDetailDialog } from "@/domains/guests/adapters/next/components/invitation-detail-dialog"
import { InvitationsTable } from "@/domains/guests/adapters/next/components/invitations-table"
import { SeatingBoard } from "@/domains/guests/adapters/next/components/seating-board"
import { buildInvitationMessage } from "@/domains/guests/application/build-invitation-message"
import type {
  InvitationPartyDto,
  InvitationPartyGuestDto,
} from "@/domains/guests/application/dtos/invitation-party.dto"
import type { TableDto } from "@/domains/guests/application/dtos/table.dto"
import { useDemoState } from "@/core/demo/use-demo-state"
import { cn } from "@/shared/lib/utils"

export function GuestsView({
  initialParties,
  initialTables,
  initialWhatsappMessage,
}: {
  initialParties: InvitationPartyDto[]
  initialTables: TableDto[]
  initialWhatsappMessage: string
}) {
  const [parties, setParties, isDemo] = useDemoState("guest-parties", initialParties)
  const [tables, setTables] = useDemoState("guest-tables", initialTables)
  const [tab, setTab] = useState<"lista" | "mesas">("lista")
  const [detailParty, setDetailParty] = useState<InvitationPartyDto | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<InvitationPartyDto | null>(null)
  const [groupName, setGroupName] = useState("")
  const [memberDrafts, setMemberDrafts] = useState<PartyMemberDraft[]>([
    { ...EMPTY_MEMBER },
  ])
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [importDialogOpen, setImportDialogOpen] = useState(false)

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
      const inviteeNames = guests.map((guest) => guest.name).join(" y ")
      const savedParty: InvitationPartyDto = {
        id: partyId,
        weddingId: "demo",
        inviteToken,
        group: groupName,
        invite: editingParty?.invite ?? "Pendiente",
        displayName: `Invitación para ${inviteeNames}`,
        inviteeNames,
        recipient: recipientGuest,
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
    const phone = party.recipient.phone?.replace(/[^\d]/g, "")

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
      const nextParties = await markGuestPartiesInvitedAction([party.id])
      setParties(nextParties)
    } catch {
      setActionError("No se pudo marcar la invitación como enviada.")
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
          onViewDetail={setDetailParty}
          onEdit={openEditDialog}
          onDelete={handleDeleteParty}
          onSend={handleSendWhatsapp}
        />
      ) : (
        <SeatingBoard
          parties={parties}
          setParties={setParties}
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

      <ImportGuestsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        parties={parties}
        isDemo={isDemo}
        onImported={(newParties) => {
          if (newParties.length === 0) {
            return
          }
          setParties((current) => [...current, ...newParties])
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
