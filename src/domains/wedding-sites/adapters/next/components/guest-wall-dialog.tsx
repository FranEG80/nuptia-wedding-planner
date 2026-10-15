"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react"
import { X } from "lucide-react"

import type { VerifyGuestPhoneResult } from "@/domains/wedding-sites/adapters/next/guest-access-actions"
import { GuestAccessRequestError, verifyGuestPhoneRequest } from "@/domains/wedding-sites/adapters/next/components/guest-access-request"
import {
  clearStoredGuestAccess,
  saveStoredGuestAccess,
  useStoredGuestAccess,
  type StoredGuestAccess,
} from "@/domains/wedding-sites/adapters/next/components/guest-access-storage"

import styles from "./guest-wall.module.css"

const ERROR_MESSAGES: Record<
  Exclude<VerifyGuestPhoneResult["status"], "found" | "photographer">,
  string
> = {
  invalid_phone: "Escribe un teléfono válido, con 9 cifras.",
  not_found:
    "No encontramos ese número entre los invitados. Revisa que sea el mismo con el que recibiste la invitación.",
  unavailable: "No se pudo comprobar ahora mismo. Inténtalo de nuevo.",
}

export interface GuestWallDialogContentProps {
  access: StoredGuestAccess
  /** Olvida la identidad guardada ("No soy yo"). */
  signOut: () => void
  /** Cierra el modal. */
  close: () => void
}

/**
 * Botón de una sección del muro (firmas, galería) que abre un modal de papel.
 * Quien no se ha identificado ve primero el acceso por teléfono; después, en
 * el mismo modal, `children`. El contenido sigue montado con el modal cerrado:
 * una subida en curso continúa y el borrador de la firma no se pierde.
 */
export function GuestWallDialog({
  slug,
  preview = false,
  label,
  icon,
  title,
  note,
  children,
}: {
  slug: string
  preview?: boolean
  /** Texto del botón que abre el modal. */
  label: string
  icon?: ReactNode
  /** Título manuscrito del modal. */
  title: string
  /** Aviso bajo el botón, como la firma recién colgada. */
  note?: ReactNode
  children: (props: GuestWallDialogContentProps) => ReactNode
}) {
  const titleId = useId()
  const access = useStoredGuestAccess(slug)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pressedBackdropRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)

  // El estado manda y el <dialog> lo sigue. Al abrir, y al cambiar de paso
  // dentro del modal (identificarse, "No soy yo"), el foco va al primer campo.
  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (!isOpen) {
      if (dialog.open) {
        dialog.close()
      }
      return
    }

    if (!dialog.open) {
      dialog.showModal()
    }

    focusFirstField(dialog)
  }, [isOpen, access])

  // En el editor de la web no se identifica a nadie.
  if (preview) {
    return null
  }

  function close() {
    setIsOpen(false)
  }

  function signOut() {
    clearStoredGuestAccess(slug)
  }

  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.primary}
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        {icon}
        {label}
      </button>
      {note && (
        <p className={styles.note} role="status">
          {note}
        </p>
      )}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        // Escape cierra el diálogo por su cuenta: el estado se entera aquí.
        onClose={close}
        // Cerrar al pulsar fuera, pero no al soltar fuera un gesto que empezó
        // dentro (seleccionar texto del mensaje, por ejemplo).
        onPointerDown={(event) => {
          pressedBackdropRef.current = event.target === event.currentTarget
        }}
        onClick={(event) => {
          if (pressedBackdropRef.current && event.target === event.currentTarget) {
            close()
          }
        }}
      >
        <div className={styles.sheet}>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {access && (
              <p className={styles.identity}>
                <span>
                  {access.role === "guest" ? `Hola, ${access.firstName}` : "Acceso de fotógrafo"}
                </span>
                <span aria-hidden="true">·</span>
                <button type="button" className={styles.textButton} onClick={signOut}>
                  {access.role === "guest" ? "No soy yo" : "Salir"}
                </button>
              </p>
            )}
          </header>

          <div className={styles.body}>
            {isOpen &&
              (access ? children({ access, signOut, close }) : <GuestPhoneAccess slug={slug} />)}
          </div>

          <button type="button" className={styles.close} onClick={close} aria-label="Cerrar">
            <X aria-hidden="true" strokeWidth={1.6} />
          </button>
        </div>
      </dialog>
    </div>
  )
}

/** Primer campo marcado con `data-autofocus`; si no hay, el navegador decide. */
function focusFirstField(dialog: HTMLDialogElement) {
  dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus()
}

/** Paso previo: el teléfono con el que el invitado recibió la invitación. */
function GuestPhoneAccess({ slug }: { slug: string }) {
  const inputId = useId()
  const errorId = useId()
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const submittedPhone = phone

    startTransition(async () => {
      try {
        const result = await verifyGuestPhoneRequest({ slug, phone: submittedPhone })

        if (result.status === "found") {
          saveStoredGuestAccess(slug, {
            role: "guest",
            guestId: result.guest.id,
            firstName: result.guest.firstName,
            fullName: result.guest.fullName,
            partyName: result.guest.partyName,
          })
          return
        }

        if (result.status === "photographer") {
          // El teléfono se guarda para que el servidor lo valide al subir.
          saveStoredGuestAccess(slug, { role: "photographer", phone: submittedPhone })
          return
        }

        setError(ERROR_MESSAGES[result.status])
      } catch (error) {
        setError(error instanceof GuestAccessRequestError && error.requestId
          ? `${ERROR_MESSAGES.unavailable} Referencia: ${error.requestId}`
          : ERROR_MESSAGES.unavailable)
      }
    })
  }

  return (
    <form className={styles.access} onSubmit={handleSubmit}>
      <p className={styles.lead}>
        Antes, dinos quién eres: escribe el teléfono con el que te llegó la invitación.
      </p>
      <label className={styles.label} htmlFor={inputId}>
        Tu teléfono
      </label>
      <input
        id={inputId}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="600 000 000"
        required
        disabled={isPending}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={styles.phone}
        data-autofocus
      />
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <button type="submit" disabled={isPending} className={styles.primary}>
        {isPending ? "Comprobando…" : "Continuar"}
      </button>
    </form>
  )
}
