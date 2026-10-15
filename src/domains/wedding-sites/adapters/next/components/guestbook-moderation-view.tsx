"use client"

import { useState, useTransition } from "react"
import { ExternalLink, Eye, EyeOff, Loader2, Trash2 } from "lucide-react"

import { useDemoState } from "@/core/demo/use-demo-state"
import {
  deleteGuestbookSignatureAction,
  setGuestbookSignatureStatusAction,
} from "@/domains/wedding-sites/adapters/next/guestbook-moderation-actions"
import type { GuestbookModerationSignatureDto } from "@/domains/wedding-sites/application/dtos/guestbook.dto"
import type { GuestbookSignatureStatus } from "@/domains/wedding-sites/domain/guestbook"
import { cn } from "@/shared/lib/utils"

type Filter = "all" | GuestbookSignatureStatus

// Hora de la boda, igual en servidor y navegador para no romper la hidratación.
const signedAtFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
})

function SignatureCard({
  signature,
  onToggle,
  onDelete,
}: {
  signature: GuestbookModerationSignatureDto
  onToggle: (signature: GuestbookModerationSignatureDto) => Promise<void>
  onDelete: (signature: GuestbookModerationSignatureDto) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const hidden = signature.status === "hidden"

  return (
    <li
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm transition-colors",
        hidden ? "border-dashed border-border bg-muted/40" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-serif text-lg text-foreground">{signature.authorName}</p>
            {hidden && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Oculta en la web
              </span>
            )}
          </div>
          <p
            className={cn(
              "mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-foreground",
              hidden && "text-muted-foreground",
            )}
          >
            {signature.message}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Firmó {signature.guestName} ·{" "}
            <time dateTime={signature.createdAt}>
              {signedAtFormatter.format(new Date(signature.createdAt))}
            </time>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => onToggle(signature))}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
            ) : hidden ? (
              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
            ) : (
              <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
            {hidden ? "Mostrar" : "Ocultar"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => onDelete(signature))}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            aria-label={`Borrar la firma de ${signature.authorName}`}
            title="Borrar firma"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </li>
  )
}

export function GuestbookModerationView({
  signatures,
  publicUrl,
}: {
  signatures: GuestbookModerationSignatureDto[]
  publicUrl: string
}) {
  // Solo los cambios hechos aquí: las firmas llegan del servidor y, tras cada
  // acción, se recargan con el estado ya guardado.
  const [statusById, setStatusById, isDemo] = useDemoState<
    Record<string, GuestbookSignatureStatus>
  >("guestbook-moderation-status", {})
  const [deletedIds, setDeletedIds] = useDemoState<string[]>("guestbook-moderation-deleted", [])
  const [filter, setFilter] = useState<Filter>("all")
  const [actionError, setActionError] = useState<string | null>(null)

  const visible = signatures
    .filter((signature) => !deletedIds.includes(signature.id))
    .map((signature) => ({
      ...signature,
      status: statusById[signature.id] ?? signature.status,
    }))
  const hiddenCount = visible.filter((signature) => signature.status === "hidden").length
  const counts: Record<Filter, number> = {
    all: visible.length,
    published: visible.length - hiddenCount,
    hidden: hiddenCount,
  }
  const filtered =
    filter === "all" ? visible : visible.filter((signature) => signature.status === filter)

  function setStatus(signatureId: string, status: GuestbookSignatureStatus) {
    setStatusById((current) => ({ ...current, [signatureId]: status }))
  }

  async function handleToggle(signature: GuestbookModerationSignatureDto) {
    const nextStatus: GuestbookSignatureStatus =
      signature.status === "hidden" ? "published" : "hidden"

    setActionError(null)
    setStatus(signature.id, nextStatus)

    if (isDemo) {
      return
    }

    const saved = await setGuestbookSignatureStatusAction({
      signatureId: signature.id,
      status: nextStatus,
    }).catch(() => false)

    if (!saved) {
      setStatus(signature.id, signature.status)
      setActionError("No se pudo guardar el cambio. Inténtalo de nuevo.")
    }
  }

  async function handleDelete(signature: GuestbookModerationSignatureDto) {
    if (
      !window.confirm(
        `¿Borrar la firma de ${signature.authorName}? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }

    setActionError(null)
    setDeletedIds((current) => [...current, signature.id])

    if (isDemo) {
      return
    }

    const deleted = await deleteGuestbookSignatureAction({ signatureId: signature.id }).catch(
      () => false,
    )

    if (!deleted) {
      setDeletedIds((current) => current.filter((id) => id !== signature.id))
      setActionError("No se pudo borrar la firma. Inténtalo de nuevo.")
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "published", label: "Publicadas" },
    { id: "hidden", label: "Ocultas" },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Firmas</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Lo que vuestros invitados os dejan en el tablón de la web. Las firmas se publican al
            momento: ocultad las que no queráis que se vean o borradlas para siempre.
          </p>
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          Abrir la web
        </a>
      </div>

      {visible.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar firmas">
          {filters.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === option.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {option.label} · {counts[option.id]}
            </button>
          ))}
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-serif text-xl text-foreground">Todavía no hay firmas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando vuestros invitados firmen en la web, sus mensajes aparecerán aquí.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {filter === "hidden" ? "No hay firmas ocultas." : "No hay firmas publicadas."}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((signature) => (
            <SignatureCard
              key={signature.id}
              signature={signature}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
