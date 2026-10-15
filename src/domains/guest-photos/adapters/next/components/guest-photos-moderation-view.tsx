"use client"

import Image from "next/image"
import { useState, useTransition } from "react"
import { Eye, EyeOff, ImageOff, Trash2 } from "lucide-react"

import { useDemoState } from "@/core/demo/use-demo-state"
import {
  deleteGuestPhotoAction,
  setGuestPhotoStatusAction,
} from "@/domains/guest-photos/adapters/next/guest-photo-moderation-actions"
import type { GuestPhotoModerationDto } from "@/domains/guest-photos/application/dtos/guest-photo-moderation.dto"
import type { GuestPhotoStatus } from "@/domains/guest-photos/domain/guest-photo"
import { cn } from "@/shared/lib/utils"

type Filter = "all" | GuestPhotoStatus

// Hora de la boda fija: si no, el servidor (UTC) y el navegador no coinciden al hidratar.
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
})

function uploaderName(photo: GuestPhotoModerationDto) {
  if (photo.uploaderRole === "photographer") {
    return "Fotógrafo"
  }

  return photo.credit ?? "Invitado"
}

export function GuestPhotosModerationView({
  photos: initialPhotos,
}: {
  photos: GuestPhotoModerationDto[]
}) {
  const [photos, setPhotos, isDemo] = useDemoState("guest-photos", initialPhotos)
  const [filter, setFilter] = useState<Filter>("all")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const publishedCount = photos.filter((photo) => photo.status === "published").length
  const hiddenCount = photos.length - publishedCount
  const visiblePhotos =
    filter === "all" ? photos : photos.filter((photo) => photo.status === filter)
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Todas", count: photos.length },
    { value: "published", label: "Publicadas", count: publishedCount },
    { value: "hidden", label: "Ocultas", count: hiddenCount },
  ]

  function handleToggle(photo: GuestPhotoModerationDto) {
    const status: GuestPhotoStatus = photo.status === "published" ? "hidden" : "published"

    setError(null)

    if (isDemo) {
      setPhotos((current) =>
        current.map((p) => (p.id === photo.id ? { ...p, status } : p)),
      )
      return
    }

    setPendingId(photo.id)
    startTransition(async () => {
      try {
        const result = await setGuestPhotoStatusAction({ photoId: photo.id, status })

        if (result.status === "updated") {
          setPhotos((current) =>
            current.map((p) => (p.id === photo.id ? result.photo : p)),
          )
        } else {
          setError("No se pudo cambiar la foto. Recargad la página y probad otra vez.")
        }
      } catch {
        setError("No se pudo cambiar la foto. Revisad la conexión y probad otra vez.")
      } finally {
        setPendingId(null)
      }
    })
  }

  function handleDelete(photo: GuestPhotoModerationDto) {
    setError(null)
    setConfirmingDeleteId(null)

    if (isDemo) {
      setPhotos((current) => current.filter((p) => p.id !== photo.id))
      return
    }

    setPendingId(photo.id)
    startTransition(async () => {
      try {
        const result = await deleteGuestPhotoAction({ photoId: photo.id })

        if (result.status === "deleted" || result.status === "not_found") {
          // not_found: ya la había borrado otra pestaña; se quita igual.
          setPhotos((current) => current.filter((p) => p.id !== photo.id))
        } else {
          setError("No se pudo borrar la foto. Recargad la página y probad otra vez.")
        }
      } catch {
        setError("No se pudo borrar la foto. Revisad la conexión y probad otra vez.")
      } finally {
        setPendingId(null)
      }
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Galería de fotos</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Las fotos que suben invitados y fotógrafos aparecen en la web al momento. Si
          alguna no os gusta, ocultadla: deja de verse en la galería y podéis volver a
          mostrarla cuando queráis. Borrarla la elimina para siempre.
        </p>
      </div>

      {photos.length > 0 && (
        <div
          role="group"
          aria-label="Filtrar fotos"
          className="inline-flex rounded-lg border border-border bg-card p-1 text-sm"
        >
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                filter === option.value
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>
      )}

      <p role="status" className="text-sm text-destructive empty:hidden">
        {error}
      </p>

      {visiblePhotos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <ImageOff className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            {photos.length === 0
              ? "Todavía nadie ha subido fotos a la galería."
              : filter === "hidden"
                ? "No hay fotos ocultas."
                : "No hay fotos publicadas."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visiblePhotos.map((photo) => {
            const hidden = photo.status === "hidden"
            const pending = pendingId === photo.id

            return (
              <li
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-square bg-secondary"
                  aria-label={`Ver en grande la foto de ${uploaderName(photo)}`}
                >
                  <Image
                    src={photo.thumbnailUrl}
                    alt=""
                    width={640}
                    height={640}
                    unoptimized
                    loading="lazy"
                    className={cn(
                      "h-full w-full object-cover transition-opacity",
                      hidden && "opacity-40 grayscale",
                    )}
                  />
                  {hidden && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
                      <EyeOff className="h-3 w-3" strokeWidth={2} />
                      Oculta
                    </span>
                  )}
                </a>
                <div className="space-y-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {uploaderName(photo)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(photo.createdAt))}
                    </p>
                  </div>
                  {confirmingDeleteId === photo.id ? (
                    <div className="space-y-2">
                      <p className="text-xs text-foreground">
                        ¿Borrar para siempre? No se puede deshacer.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(null)}
                          className="flex-1 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(photo)}
                          className="flex-1 rounded-md bg-destructive px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-destructive/90"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleToggle(photo)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50",
                          hidden
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border border-border text-foreground hover:bg-secondary",
                        )}
                      >
                        {hidden ? (
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                        )}
                        {pending ? "Guardando…" : hidden ? "Mostrar" : "Ocultar"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setConfirmingDeleteId(photo.id)}
                        aria-label={`Borrar la foto de ${uploaderName(photo)}`}
                        title="Borrar"
                        className="shrink-0 rounded-md border border-border px-2.5 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
