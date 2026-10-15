"use client"

import Image from "next/image"
import { useEffect, useId, useRef, useState, type DragEvent } from "react"
import { Check, ImagePlus, X } from "lucide-react"

import {
  completeGuestPhotoUploadAction,
  requestGuestPhotoUploadAction,
  type CompleteGuestPhotoUploadActionResult,
  type RequestGuestPhotoUploadActionResult,
} from "@/domains/guest-photos/adapters/next/guest-photo-actions"
import type { GuestPhotoDto } from "@/domains/guest-photos/application/dtos/guest-photo.dto"
import type { GuestPhotoCreditChoice } from "@/domains/guest-photos/domain/guest-photo"
import {
  GUEST_PHOTO_CUSTOM_CREDIT_MAX_LENGTH,
  GUEST_PHOTO_MAX_BYTES,
  guestPhotoExtension,
  normalizeCustomCredit,
} from "@/domains/guest-photos/domain/guest-photo-rules"
import {
  toGuestWallUploaderClaim,
  type StoredGuestAccess,
} from "@/domains/wedding-sites/adapters/next/components/guest-access-storage"
import { putFileWithProgress } from "@/domains/wedding-sites/adapters/next/components/guest-photos/put-file-with-progress"
import { cn } from "@/shared/lib/utils"

import wall from "../guest-wall.module.css"
import styles from "./guest-photo-gallery.module.css"

/** Subidas en paralelo: suficiente para no esperar y sin saturar el móvil. */
const UPLOAD_CONCURRENCY = 2
const MAX_SIZE_LABEL = `${Math.round(GUEST_PHOTO_MAX_BYTES / (1024 * 1024))} MB`

/**
 * selected: elegida, esperando a que el invitado pulse Enviar.
 * error: falló; si `canRetry`, Enviar la vuelve a intentar.
 */
type UploadStatus = "selected" | "uploading" | "processing" | "done" | "error"

interface UploadItem {
  id: string
  file: File
  previewUrl: string
  status: UploadStatus
  progress: number
  error: string | null
  /** Falso si el archivo no vale (formato, tamaño): reintentar no cambia nada. */
  canRetry: boolean
}

type FailedStatus = Exclude<
  RequestGuestPhotoUploadActionResult["status"] | CompleteGuestPhotoUploadActionResult["status"],
  "ready" | "published"
>

const GENERIC_ERROR = "No se pudo subir la foto. Revisa la conexión e inténtalo de nuevo."
const HEIC_ERROR = "Las fotos HEIC no se pueden subir: guárdalas como JPG y vuelve a elegirlas."

const ERROR_MESSAGES: Record<FailedStatus, string> = {
  unknown_uploader: "No te encontramos en la lista. Pulsa «No soy yo» y vuelve a identificarte.",
  unsupported_type: "Alguna foto tiene un formato no admitido. Usa JPG, PNG o WebP.",
  too_large: `Alguna foto ocupa más de ${MAX_SIZE_LABEL}.`,
  not_uploaded: "Alguna foto no llegó a subirse. Inténtalo de nuevo.",
  invalid_image: "Algún archivo no parece una foto válida.",
  unavailable: "La subida de fotos no está disponible ahora mismo.",
  invalid_request: GENERIC_ERROR,
  failed: GENERIC_ERROR,
}

const NOT_RETRYABLE: ReadonlySet<FailedStatus> = new Set([
  "unsupported_type",
  "too_large",
  "invalid_image",
])

function validateFile(file: File): string | null {
  if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    return HEIC_ERROR
  }

  if (!guestPhotoExtension(file.type)) {
    return ERROR_MESSAGES.unsupported_type
  }

  if (file.size === 0 || file.size > GUEST_PHOTO_MAX_BYTES) {
    return ERROR_MESSAGES.too_large
  }

  return null
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** Texto corto bajo cada miniatura; el detalle de los errores va debajo. */
function tileLabel(item: UploadItem) {
  switch (item.status) {
    case "selected":
      return formatSize(item.file.size)
    case "uploading":
      return `${Math.round(item.progress * 100)} %`
    case "processing":
      return "Revelando…"
    case "done":
      return "Subida"
    case "error":
      return item.canRetry ? "No se subió" : "No admitida"
  }
}

function photosLabel(count: number) {
  return count === 1 ? "1 foto" : `${count} fotos`
}

function isSendable(item: UploadItem) {
  return item.status === "selected" || (item.status === "error" && item.canRetry)
}

function isActive(item: UploadItem) {
  return item.status === "uploading" || item.status === "processing"
}

/**
 * Subida de fotos para quien ya se ha identificado, dentro del modal del
 * muro. El invitado elige las fotos, las revisa (puede quitar las que no
 * quiera) y pulsa Enviar. Cada original va directo a R2 con una URL firmada;
 * después el servidor genera la WebP y la miniatura.
 */
export function GuestPhotoUploader({
  slug,
  access,
  onUploaded,
  onClose,
}: {
  slug: string
  access: StoredGuestAccess
  onUploaded: (photo: GuestPhotoDto) => void
  /** Cierra el modal para ver las fotos recién subidas. */
  onClose: () => void
}) {
  const inputId = useId()
  const creditLabelId = useId()
  const customCreditId = useId()
  const [creditChoice, setCreditChoice] = useState<GuestPhotoCreditChoice>("individual")
  const [customCredit, setCustomCredit] = useState("")
  const [items, setItems] = useState<UploadItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Las vistas previas son object URLs: se liberan al desmontar.
  useEffect(
    () => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)),
    [],
  )

  const partyName = access.role === "guest" ? access.partyName : null
  const sendable = items.filter(isSendable)
  const activeCount = items.filter(isActive).length
  const doneCount = items.filter((item) => item.status === "done").length
  const isSending = activeCount > 0
  const allDone = items.length > 0 && doneCount === items.length
  // Con "Otro nombre" hay que escribir algo antes de poder enviar.
  const isMissingCustomCredit = creditChoice === "custom" && !normalizeCustomCredit(customCredit)
  const errorMessages = [
    ...new Set(
      items.flatMap((item) => (item.status === "error" && item.error ? [item.error] : [])),
    ),
  ]

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function fail(id: string, status: FailedStatus) {
    updateItem(id, {
      status: "error",
      error: ERROR_MESSAGES[status],
      canRetry: !NOT_RETRYABLE.has(status),
    })
  }

  async function uploadItem(
    item: UploadItem,
    choice: GuestPhotoCreditChoice,
    customName: string | null,
  ) {
    const uploader = toGuestWallUploaderClaim(access)
    const contentType = item.file.type
    updateItem(item.id, { status: "uploading", progress: 0, error: null })

    try {
      const request = await requestGuestPhotoUploadAction({
        slug,
        uploader,
        contentType,
        size: item.file.size,
      })

      if (request.status !== "ready") {
        fail(item.id, request.status)
        return
      }

      await putFileWithProgress({
        url: request.uploadUrl,
        file: item.file,
        contentType,
        onProgress: (progress) => updateItem(item.id, { progress }),
      })
      updateItem(item.id, { status: "processing", progress: 1 })

      const result = await completeGuestPhotoUploadAction({
        slug,
        uploader,
        photoId: request.photoId,
        contentType,
        creditChoice: choice,
        customCredit: customName,
      })

      if (result.status !== "published") {
        fail(item.id, result.status)
        return
      }

      updateItem(item.id, { status: "done" })
      onUploaded(result.photo)
    } catch {
      updateItem(item.id, { status: "error", error: GENERIC_ERROR, canRetry: true })
    }
  }

  async function send() {
    const queue = items.filter(isSendable)
    // La firma elegida al pulsar Enviar vale para toda la tanda.
    const choice = creditChoice
    const customName = choice === "custom" ? normalizeCustomCredit(customCredit) : null
    let next = 0

    async function worker() {
      while (next < queue.length) {
        const item = queue[next]
        next += 1
        await uploadItem(item, choice, customName)
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, worker),
    )
  }

  function addFiles(files: FileList | File[] | null) {
    const selected = files ? Array.from(files) : []

    if (!selected.length) {
      return
    }

    // Lo que no se puede subir se marca al elegirlo, antes de pulsar Enviar.
    const added: UploadItem[] = selected.map((file) => {
      const validationError = validateFile(file)

      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: validationError ? "error" : "selected",
        progress: 0,
        error: validationError,
        canRetry: !validationError,
      }
    })

    // Al volver a elegir, las ya subidas salen de la lista: empieza otra tanda.
    items
      .filter((item) => item.status === "done")
      .forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setItems((current) => [...current.filter((item) => item.status !== "done"), ...added])
  }

  function remove(item: UploadItem) {
    URL.revokeObjectURL(item.previewUrl)
    setItems((current) => current.filter((candidate) => candidate.id !== item.id))
  }

  function removeAll() {
    const removable = items.filter((item) => !isActive(item))
    removable.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setItems((current) => current.filter(isActive))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    if (!isSending) {
      addFiles(event.dataTransfer.files)
    }
  }

  const fileInput = (
    <input
      id={inputId}
      type="file"
      // image/* hace que el iPhone convierta HEIC a JPEG al elegir la foto.
      accept="image/*"
      multiple
      disabled={isSending}
      className={wall.srOnly}
      onChange={(event) => {
        addFiles(event.target.files)
        event.target.value = ""
      }}
      data-autofocus
    />
  )

  return (
    <div
      className={styles.uploader}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDragging(false)
        }
      }}
      onDrop={handleDrop}
    >
      {access.role === "guest" && (
        <div className={styles.creditChoice}>
          <p id={creditLabelId} className={wall.label}>
            Firmar las fotos como
          </p>
          <div className={wall.chips} role="group" aria-labelledby={creditLabelId}>
            <button
              type="button"
              className={wall.chip}
              aria-pressed={creditChoice === "individual"}
              onClick={() => setCreditChoice("individual")}
              disabled={isSending}
            >
              {access.firstName}
            </button>
            {partyName && (
              <button
                type="button"
                className={wall.chip}
                aria-pressed={creditChoice === "party"}
                onClick={() => setCreditChoice("party")}
                disabled={isSending}
              >
                {partyName}
              </button>
            )}
            <button
              type="button"
              className={wall.chip}
              aria-pressed={creditChoice === "custom"}
              aria-controls={customCreditId}
              onClick={() => setCreditChoice("custom")}
              disabled={isSending}
            >
              Otro nombre
            </button>
          </div>
          {creditChoice === "custom" && (
            <div className={styles.customCredit}>
              <label htmlFor={customCreditId} className={wall.srOnly}>
                Nombre con el que firmar las fotos
              </label>
              <input
                id={customCreditId}
                type="text"
                value={customCredit}
                onChange={(event) => setCustomCredit(event.target.value)}
                maxLength={GUEST_PHOTO_CUSTOM_CREDIT_MAX_LENGTH}
                placeholder="Escribe cómo quieres firmar"
                autoComplete="name"
                enterKeyHint="done"
                disabled={isSending}
                autoFocus
                className={styles.customCreditInput}
              />
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className={styles.dropzone} data-dragging={isDragging || undefined}>
          <ImagePlus aria-hidden="true" className={styles.dropIcon} strokeWidth={1.2} />
          <p className={styles.dropText}>
            Elige tus fotos, revísalas y pulsa enviar.
            <span className={styles.dragHint}> También puedes arrastrarlas aquí.</span>
          </p>
          {fileInput}
          <label htmlFor={inputId} className={cn(wall.primary, styles.pickButton)}>
            Elegir fotos
          </label>
          <p className={styles.uploaderMeta}>JPG, PNG o WebP · hasta {MAX_SIZE_LABEL} por foto</p>
        </div>
      ) : (
        <div className={styles.selection} data-dragging={isDragging || undefined}>
          <p className={styles.selectionSummary} role="status">
            {allDone
              ? doneCount === 1
                ? "Foto subida. ¡Gracias!"
                : `${doneCount} fotos subidas. ¡Gracias!`
              : isSending
                ? `Enviando… ${doneCount} de ${doneCount + activeCount + sendable.length} listas`
                : doneCount > 0
                  ? `${photosLabel(doneCount)} subidas · ${photosLabel(sendable.length)} por enviar`
                  : sendable.length > 0
                    ? `${photosLabel(sendable.length)} para enviar`
                    : "Ninguna foto se puede enviar"}
          </p>

          <ul className={styles.tiles} aria-label="Fotos elegidas">
            {items.map((item) => (
              <li key={item.id} className={styles.tile} data-status={item.status}>
                <div className={styles.tilePhoto}>
                  {guestPhotoExtension(item.file.type) ? (
                    <Image
                      src={item.previewUrl}
                      alt={item.file.name}
                      width={240}
                      height={240}
                      unoptimized
                      className={styles.tileImage}
                    />
                  ) : (
                    // El navegador no sabe pintar ese formato: hueco en vez de icono roto.
                    <span className={styles.tileImage} aria-hidden="true" />
                  )}
                  {isActive(item) && (
                    <span
                      className={styles.tileProgress}
                      role="progressbar"
                      aria-label={`Progreso de ${item.file.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(item.progress * 100)}
                      data-indeterminate={item.status === "processing" || undefined}
                    >
                      <span style={{ transform: `scaleX(${item.progress})` }} />
                    </span>
                  )}
                  {item.status === "done" && (
                    <span className={styles.tileDone} aria-hidden="true">
                      <Check strokeWidth={2} />
                    </span>
                  )}
                  {(item.status === "selected" || item.status === "error") && (
                    <button
                      type="button"
                      className={styles.tileRemove}
                      onClick={() => remove(item)}
                      aria-label={`Quitar ${item.file.name}`}
                      title="Quitar"
                    >
                      <X aria-hidden="true" strokeWidth={2} />
                    </button>
                  )}
                </div>
                <span className={styles.tileLabel}>{tileLabel(item)}</span>
              </li>
            ))}
          </ul>

          {isMissingCustomCredit && sendable.length > 0 && (
            <p className={styles.selectionHint}>Escribe arriba el nombre con el que firmar.</p>
          )}

          {errorMessages.length > 0 && !isSending && (
            <ul className={styles.selectionErrors} role="alert">
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}

          {allDone ? (
            <p className={styles.selectionActions}>
              <button type="button" className={wall.primary} onClick={onClose}>
                Ver la galería
              </button>
              {fileInput}
              <label htmlFor={inputId} className={wall.textButton}>
                Subir más fotos
              </label>
            </p>
          ) : (
            <p className={styles.selectionActions}>
              <button
                type="button"
                className={wall.primary}
                onClick={() => void send()}
                disabled={isSending || sendable.length === 0 || isMissingCustomCredit}
              >
                {isSending
                  ? "Enviando…"
                  : sendable.every((item) => item.status === "error")
                    ? `Reintentar ${photosLabel(sendable.length)}`
                    : `Enviar ${photosLabel(sendable.length)}`}
              </button>
              {!isSending && (
                <span className={styles.selectionLinks}>
                  {fileInput}
                  <label htmlFor={inputId} className={wall.textButton}>
                    Añadir más
                  </label>
                  <span aria-hidden="true">·</span>
                  <button type="button" className={wall.textButton} onClick={removeAll}>
                    Quitar todas
                  </button>
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
