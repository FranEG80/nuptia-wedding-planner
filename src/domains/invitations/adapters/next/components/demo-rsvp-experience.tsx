"use client"

import { Dialog } from "@base-ui/react/dialog"
import Image from "next/image"
import { useMemo, useState } from "react"

import { mariaDanielaAssets } from "@/domains/wedding-sites/adapters/next/components/maria-daniela-assets"
import type {
  PublicInvitationGuestDto,
  PublicInvitationMenuDto,
} from "@/domains/invitations/application/dtos/public-invitation.dto"
import type {
  RsvpSubmitPayload,
  RsvpSubmitResult,
} from "@/domains/invitations/adapters/next/components/rsvp-experience"

import styles from "./demo-rsvp-experience.module.css"

type Step = "attendance" | "details" | "menu" | "notes" | "message" | "review" | "success"

interface GuestDraft {
  id: string
  role: PublicInvitationGuestDto["role"]
  name: string
  email: string
  phone: string
  notes: string
  attending: boolean | null
  menuSelections: Record<string, string>
}

function guestDraft(guest: PublicInvitationGuestDto): GuestDraft {
  return {
    id: guest.id,
    role: guest.role,
    name: guest.name,
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    notes: guest.notes,
    attending: guest.rsvp === "Confirmado" ? true : guest.rsvp === "Declinado" ? false : null,
    menuSelections: Object.fromEntries(guest.menuSelections.map((selection) => [selection.menuDishId, selection.dishOptionId])),
  }
}

export function DemoRsvpExperience({
  guests,
  menu,
  onSubmit,
  preview = false,
  title,
  subtitle,
}: {
  guests: PublicInvitationGuestDto[]
  menu?: PublicInvitationMenuDto | null
  onSubmit?: (payload: RsvpSubmitPayload) => Promise<RsvpSubmitResult>
  preview?: boolean
  title: string
  subtitle: string
}) {
  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState(() => guests.map(guestDraft))
  const [step, setStep] = useState<Step>("attendance")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const hasMenu = Boolean(menu?.dishes.some((dish) => dish.options.length > 0))
  const attending = drafts.filter((guest) => guest.attending)
  const steps = useMemo<Step[]>(() => {
    if (!drafts.some((guest) => guest.attending)) {
      return ["attendance", "message", "review", "success"]
    }

    return ["attendance", "details", ...(hasMenu ? ["menu" as const] : []), "notes", "message", "review", "success"]
  }, [drafts, hasMenu])
  const index = Math.max(steps.indexOf(step), 0)
  const progress = step === "success" ? 100 : Math.round(((index + 1) / (steps.length - 1)) * 100)

  function updateGuest(id: string, patch: Partial<GuestDraft>) {
    setDrafts((current) => current.map((guest) => guest.id === id ? { ...guest, ...patch } : guest))
    setError(null)
  }

  function changeAttendance(choice: string) {
    setDrafts((current) =>
      current.map((guest) => ({
        ...guest,
        attending:
          choice === "all" || choice === `guest:${guest.id}`
            ? true
            : false,
      })),
    )
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen && step === "success") setStep("attendance")
  }

  function validate() {
    if (step === "attendance" && drafts.some((guest) => guest.attending === null)) {
      setError("Indica si asistirá cada persona de la invitación.")
      return false
    }

    if (step === "details") {
      for (const guest of attending) {
        if (guest.role === "primary" && !guest.email.trim() && !guest.phone.trim()) {
          setError(`Añade un teléfono o email para ${guest.name}.`)
          return false
        }
        if (guest.email && !/^\S+@\S+\.\S+$/.test(guest.email)) {
          setError(`Revisa el email de ${guest.name}.`)
          return false
        }
      }
    }

    setError(null)
    return true
  }

  function next() {
    if (!validate()) return
    const nextStep = steps[index + 1]
    if (nextStep) setStep(nextStep)
  }

  function back() {
    const previous = steps[index - 1]
    if (previous) setStep(previous)
    setError(null)
  }

  function payload(): RsvpSubmitPayload {
    return {
      guests: drafts.map((guest) => ({
        guestId: guest.id,
        attending: guest.attending === true,
        email: guest.email.trim() || null,
        phone: guest.phone.trim() || null,
        notes: guest.attending ? guest.notes.trim() : "",
        menuSelections: guest.attending
          ? Object.entries(guest.menuSelections).filter(([, option]) => Boolean(option)).map(([menuDishId, dishOptionId]) => ({ menuDishId, dishOptionId }))
          : [],
      })),
      message: message.trim() || null,
    }
  }

  async function confirm() {
    setSubmitting(true)
    setError(null)

    try {
      const response = onSubmit ? await onSubmit(payload()) : { guests }
      if (!response) throw new Error("No response")
      if (!preview) setDrafts(response.guests.map(guestDraft))
      setStep("success")
    } catch {
      setError("No hemos podido guardar la respuesta. Inténtalo de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger type="button" aria-label="Confirmar asistencia" className={styles.trigger} onClick={() => setOpen(true)}>
        <Image draggable="false"
          src={mariaDanielaAssets.buttonOutline}
          alt=""
          fill
          sizes="320px"
          className={styles.triggerArt}
          unoptimized
        />
        <span>Confirmar</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Viewport className={styles.viewport}>
          <Dialog.Popup className={styles.popup}>
            <div className={styles.artPanel}>
              <Image draggable="false" src={mariaDanielaAssets.watercolorSides} alt="" fill sizes="360px" />
              <div>
                <Image draggable="false" src={step === "success" ? mariaDanielaAssets.discoBallLight : mariaDanielaAssets.checklist} alt="" width={150} height={150} />
                <p>RSVP</p>
                <strong>{title}</strong>
              </div>
            </div>

            <div className={styles.formPanel}>
              <Dialog.Close className={styles.close} aria-label="Cerrar">Cerrar</Dialog.Close>
              <div className={styles.progress} aria-label={`Progreso ${progress}%`}><span style={{ width: `${progress}%` }} /></div>

              <Dialog.Title className={styles.title}>{stepTitle(step)}</Dialog.Title>
              <Dialog.Description className={styles.description}>
                {step === "attendance" ? subtitle : stepDescription(step)}
              </Dialog.Description>

              <div className={styles.stepBody}>
                {step === "attendance" && (
                  <fieldset className={styles.attendanceCard}>
                    <legend>¿Quién asistirá?</legend>
                    {demoAttendanceOptions(drafts).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={demoAttendanceChoice(drafts) === option.value ? styles.selected : undefined}
                        onClick={() => changeAttendance(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </fieldset>
                )}

                {step === "details" && attending.map((guest) => (
                  <fieldset key={guest.id} className={styles.fields}>
                    <legend>{guest.name}</legend>
                    <label>Teléfono{guest.role !== "primary" ? " (opcional)" : ""}<input type="tel" value={guest.phone} onChange={(event) => updateGuest(guest.id, { phone: event.target.value })} /></label>
                    <label>Email (opcional)<input type="email" value={guest.email} onChange={(event) => updateGuest(guest.id, { email: event.target.value })} /></label>
                  </fieldset>
                ))}

                {step === "menu" && attending.map((guest) => (
                  <fieldset key={guest.id} className={styles.fields}>
                    <legend>Menú de {guest.name}</legend>
                    {menu?.dishes.map((dish) => (
                      <label key={dish.id}>{dish.name}
                        <select value={guest.menuSelections[dish.id] ?? ""} onChange={(event) => updateGuest(guest.id, { menuSelections: { ...guest.menuSelections, [dish.id]: event.target.value } })}>
                          <option value="">Elegir opción</option>
                          {dish.options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      </label>
                    ))}
                  </fieldset>
                ))}

                {step === "notes" && attending.map((guest) => (
                  <label key={guest.id} className={styles.textareaLabel}>Alergias o necesidades de {guest.name}
                    <textarea value={guest.notes} onChange={(event) => updateGuest(guest.id, { notes: event.target.value })} placeholder="Cuéntanos cualquier detalle que debamos saber" />
                  </label>
                ))}

                {step === "message" && <label className={styles.textareaLabel}>Un mensaje para los novios
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escribe aquí tu mensaje (opcional)" />
                </label>}

                {step === "review" && (
                  <div className={styles.review}>
                    {drafts.map((guest) => <p key={guest.id}><strong>{guest.name}</strong><span>{guest.attending ? "Asistirá" : "No asistirá"}</span></p>)}
                    {message && <blockquote>“{message}”</blockquote>}
                  </div>
                )}

                {step === "success" && (
                  <div className={styles.success}>
                    <p>{attending.length > 0 ? "¡Gracias por confirmar! Nos hace muchísima ilusión celebrarlo contigo." : "Gracias por avisarnos. Te echaremos de menos."}</p>
                    <Dialog.Close>Terminar</Dialog.Close>
                  </div>
                )}
              </div>

              {error && <p className={styles.error} role="alert">{error}</p>}
              {step !== "success" && (
                <div className={styles.actions}>
                  {index > 0 && <button type="button" onClick={back}>Anterior</button>}
                  {step === "review" ? (
                    <button type="button" onClick={confirm} disabled={submitting}>{submitting ? "Guardando…" : "Enviar confirmación"}</button>
                  ) : (
                    <button type="button" onClick={next}>Continuar</button>
                  )}
                </div>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function stepTitle(step: Step) {
  return ({ attendance: "¿Contamos contigo?", details: "Tus datos", menu: "Elige el menú", notes: "Cuidamos cada detalle", message: "Déjales unas palabras", review: "Todo listo", success: "Confirmación recibida" })[step]
}

function stepDescription(step: Step) {
  return ({ attendance: "", details: "Un teléfono o email será suficiente para mantenerte al día.", menu: "Selecciona una opción para cada asistente.", notes: "Indica alergias, intolerancias o cualquier necesidad especial.", message: "Es opcional, pero seguro que les encantará leerlo.", review: "Revisa tu respuesta antes de enviarla.", success: "" })[step]
}

function demoAttendanceChoice(guests: GuestDraft[]) {
  if (guests.some((guest) => guest.attending === null)) {
    return null
  }

  const attending = guests.filter((guest) => guest.attending)

  if (!attending.length) return "none"
  if (attending.length === guests.length) return "all"
  return `guest:${attending[0].id}`
}

function demoAttendanceOptions(guests: GuestDraft[]) {
  if (guests.length === 1) {
    return [
      { value: "all", label: "Asistiré" },
      { value: "none", label: "No podré asistir" },
    ]
  }

  return [
    { value: "all", label: "Asistiremos los dos" },
    ...guests.map((guest) => ({
      value: `guest:${guest.id}`,
      label: `Solo asistirá ${guest.name}`,
    })),
    { value: "none", label: "No podremos asistir ninguno" },
  ]
}
