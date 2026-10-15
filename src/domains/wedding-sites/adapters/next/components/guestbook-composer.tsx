"use client"

import { useId, useRef, useState, useTransition, type FormEvent } from "react"
import { PenLine } from "lucide-react"

import {
  signGuestbookAction,
  type SignGuestbookActionResult,
} from "@/domains/wedding-sites/adapters/next/guestbook-actions"
import type { StoredGuestAccess } from "@/domains/wedding-sites/adapters/next/components/guest-access-storage"
import { GuestWallDialog } from "@/domains/wedding-sites/adapters/next/components/guest-wall-dialog"
import type {
  GuestbookPageDto,
  GuestbookSignatureDto,
} from "@/domains/wedding-sites/application/dtos/guestbook.dto"
import {
  GUESTBOOK_AUTHOR_MAX_LENGTH,
  GUESTBOOK_MESSAGE_MAX_LENGTH,
} from "@/domains/wedding-sites/domain/guestbook"
import { cn } from "@/shared/lib/utils"

import wall from "./guest-wall.module.css"
import styles from "./guestbook.module.css"

type GuestAccess = Extract<StoredGuestAccess, { role: "guest" }>

type SignError = Exclude<SignGuestbookActionResult["status"], "signed">

const ERROR_MESSAGES: Record<SignError, string> = {
  empty_message: "Escribe unas palabras antes de firmar.",
  message_too_long: `El mensaje es demasiado largo: como mucho ${GUESTBOOK_MESSAGE_MAX_LENGTH} caracteres.`,
  unknown_guest:
    "No te encontramos en la lista de invitados. Pulsa «No soy yo» y vuelve a identificarte.",
  unavailable: "No se ha podido colgar tu firma ahora mismo. Inténtalo de nuevo.",
}

/** Avisamos del límite solo cuando se acerca, para no meter prisa a nadie. */
const COUNTER_THRESHOLD = GUESTBOOK_MESSAGE_MAX_LENGTH - 150

/**
 * Nombres propuestos para firmar: el suyo y el de su grupo. Además puede
 * escribir el que quiera con «Otro nombre».
 */
function signatureOptions(access: GuestAccess): string[] {
  return [...new Set([access.firstName, access.partyName])].filter(
    (name): name is string => Boolean(name?.trim()),
  )
}

/**
 * Formulario de firma del tablón para un invitado ya identificado por su
 * teléfono. Al colgar la firma, la página 1 del tablón se refresca con ella.
 */
export function GuestbookComposer({
  slug,
  access,
  onSigned,
}: {
  slug: string
  access: GuestAccess
  onSigned: (signature: GuestbookSignatureDto, firstPage: GuestbookPageDto) => void
}) {
  const messageId = useId()
  const authorId = useId()
  const errorId = useId()
  const authorRef = useRef<HTMLInputElement>(null)
  const options = signatureOptions(access)
  const [message, setMessage] = useState("")
  const [authorName, setAuthorName] = useState(access.firstName)
  // Elegido «Otro nombre» o escrito a mano: ningún nombre propuesto queda marcado.
  const [isCustomName, setIsCustomName] = useState(false)
  const [error, setError] = useState<SignError | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!message.trim()) {
      setError("empty_message")
      return
    }

    startTransition(async () => {
      try {
        const result = await signGuestbookAction({
          slug,
          guestId: access.guestId,
          authorName,
          message,
        })

        if (result.status !== "signed") {
          setError(result.status)
          return
        }

        setMessage("")
        onSigned(result.signature, result.guestbook)
      } catch {
        setError("unavailable")
      }
    })
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit} noValidate>
      <label className={wall.label} htmlFor={messageId}>
        Tu mensaje
      </label>
      <textarea
        id={messageId}
        className={styles.message}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={GUESTBOOK_MESSAGE_MAX_LENGTH}
        rows={5}
        placeholder="Queridos novios…"
        disabled={isPending}
        aria-invalid={error === "empty_message" || error === "message_too_long" || undefined}
        aria-describedby={error ? errorId : undefined}
        data-autofocus
      />
      {message.length >= COUNTER_THRESHOLD && (
        <p className={styles.counter} aria-live="polite">
          {message.length} / {GUESTBOOK_MESSAGE_MAX_LENGTH}
        </p>
      )}

      <div className={styles.signatureRow}>
        <label className={wall.label} htmlFor={authorId}>
          Firmado
        </label>
        <input
          ref={authorRef}
          id={authorId}
          className={styles.author}
          value={authorName}
          onChange={(event) => {
            setAuthorName(event.target.value)
            setIsCustomName(true)
          }}
          maxLength={GUESTBOOK_AUTHOR_MAX_LENGTH}
          placeholder="Escribe tu firma"
          autoComplete="off"
          disabled={isPending}
        />
      </div>
      <div className={cn(wall.chips, styles.options)} role="group" aria-label="Firmar como">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={wall.chip}
            aria-pressed={!isCustomName && authorName.trim() === option}
            onClick={() => {
              setAuthorName(option)
              setIsCustomName(false)
            }}
            disabled={isPending}
          >
            {option}
          </button>
        ))}
        <button
          type="button"
          className={wall.chip}
          aria-pressed={isCustomName || !options.includes(authorName.trim())}
          onClick={() => {
            setAuthorName("")
            setIsCustomName(true)
            authorRef.current?.focus()
          }}
          disabled={isPending}
        >
          Otro nombre
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className={cn(wall.error, styles.error)}>
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <button type="submit" className={cn(wall.primary, styles.submit)} disabled={isPending}>
        {isPending ? "Colgando tu firma…" : "Colgar en el tablón"}
      </button>
    </form>
  )
}

/**
 * Firma del tablón: un botón que abre el modal del muro. Quien no se ha
 * identificado pasa antes por el teléfono. Al colgar la firma el modal se
 * cierra y el tablón la enseña destacada. Los fotógrafos no firman: su acceso
 * es para subir fotos.
 */
export function GuestbookSigning({
  slug,
  preview,
  onSigned,
}: {
  slug: string
  preview: boolean
  onSigned: (signature: GuestbookSignatureDto, firstPage: GuestbookPageDto) => void
}) {
  const [thanks, setThanks] = useState<string | null>(null)

  return (
    <GuestWallDialog
      slug={slug}
      preview={preview}
      label="Firmar en el tablón"
      icon={<PenLine aria-hidden="true" strokeWidth={1.6} />}
      title="Deja tu firma"
      note={thanks}
    >
      {({ access, close }) =>
        access.role === "guest" ? (
          <GuestbookComposer
            slug={slug}
            access={access}
            onSigned={(signature, firstPage) => {
              onSigned(signature, firstPage)
              setThanks(`Gracias, ${access.firstName}: tu firma ya está en el tablón.`)
              close()
            }}
          />
        ) : (
          <p className={wall.message}>
            Las firmas son de los invitados. Con tu acceso de fotógrafo puedes subir fotos en la
            galería.
          </p>
        )
      }
    </GuestWallDialog>
  )
}
