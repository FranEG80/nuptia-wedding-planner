"use client"

import { useEffect, useMemo, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { Drawer } from "@base-ui/react/drawer"
import {
  ArrowLeftCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Minus,
  Pencil,
  Phone,
  Plus,
  X,
} from "lucide-react"

import type {
  PublicInvitationGuestDto,
  PublicInvitationMenuDto,
} from "@/domains/invitations/application/dtos/public-invitation.dto"
import type { InvitationContentDto } from "@/domains/invitations/application/dtos/invitation-design.dto"
import { cn } from "@/shared/lib/utils"

type RsvpStatus = "Confirmado" | "Declinado"
type ContactPreference = "email" | "phone"
type Step = "attendance" | "details" | "menu" | "allergies" | "message" | "summary"

export interface RsvpSubmitGuest {
  id?: string
  clientId?: string
  role?: PublicInvitationGuestDto["role"]
  name: string
  email: string | null
  phone: string | null
  notes: string
  rsvp: RsvpStatus
  menuSelections: Array<{
    menuDishId: string
    dishOptionId: string
  }>
}

export interface RsvpSubmitPayload {
  guests: RsvpSubmitGuest[]
  message: string | null
}

export type RsvpSubmitResult = {
  guests: PublicInvitationGuestDto[]
} | null

interface EditableGuest {
  localId: string
  id?: string
  clientId?: string
  role: PublicInvitationGuestDto["role"]
  firstName: string
  lastName: string
  email: string
  phone: string
  contactPreference: ContactPreference
  notes: string
  rsvp: string
  menuSelections: Record<string, string>
}

export function RsvpExperience({
  guests,
  menu,
  confirmationSeed,
  onSubmit,
  preview = false,
  title = "Nos casamos y queremos celebrarlo contigo",
  subtitle = "Pulsa el botón para confirmar tu asistencia y ayudarnos a organizarlo todo.",
  panelMotion = "slide-up",
}: {
  guests: PublicInvitationGuestDto[]
  menu?: PublicInvitationMenuDto | null
  confirmationSeed?: string
  onSubmit?: (payload: RsvpSubmitPayload) => Promise<RsvpSubmitResult>
  preview?: boolean
  title?: string
  subtitle?: string
  panelMotion?: InvitationContentDto["rsvpPanelMotion"]
}) {
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [formGuests, setFormGuests] = useState(() => normalizeGuests(guests))
  const [attendingCount, setAttendingCount] = useState(() =>
    initialAttendingCount(guests),
  )
  const [step, setStep] = useState<Step>("attendance")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedPayload, setSubmittedPayload] =
    useState<RsvpSubmitPayload | null>(null)

  const hasMenu = Boolean(menu?.dishes.some((dish) => dish.options.length > 0))

  useEffect(() => {
    const normalized = normalizeGuests(guests)
    setFormGuests((current) => {
      const companionDrafts = current.filter((guest) => !guest.id)
      return [...normalized, ...companionDrafts]
    })
    setAttendingCount(initialAttendingCount(guests))
  }, [guests])

  const steps = useMemo<Step[]>(() => {
    if (attendingCount === 0) {
      return ["attendance", "message", "summary"]
    }

    return [
      "attendance",
      "details",
      ...(hasMenu ? (["menu"] as const) : []),
      "allergies",
      "message",
      "summary",
    ]
  }, [attendingCount, hasMenu])

  const stepIndex = Math.max(steps.indexOf(step), 0)
  const progress = steps.length > 1 ? (stepIndex + 1) / steps.length : 1
  const attendingGuests = formGuests.slice(0, attendingCount)
  const confirmationCode = getConfirmationCode(
    confirmationSeed ?? formGuests.map((guest) => guest.localId).join("-"),
  )
  const attendeeNames = (submittedPayload?.guests ?? buildPayload().guests)
    .filter((guest) => guest.rsvp === "Confirmado")
    .map((guest) => guest.name)

  function ensureGuestCount(count: number) {
    setFormGuests((current) => {
      if (current.length >= count) {
        return current
      }

      const additions = Array.from({ length: count - current.length }, (_, index) =>
        createCompanionDraft(current.length + index + 1),
      )

      return [...current, ...additions]
    })
  }

  function changeAttendingCount(nextCount: number) {
    const boundedCount = Math.max(nextCount, 0)
    ensureGuestCount(boundedCount)
    setAttendingCount(boundedCount)

    if (boundedCount === 0 && (step === "details" || step === "menu" || step === "allergies")) {
      setStep("message")
    }
  }

  function updateGuest(index: number, patch: Partial<EditableGuest>) {
    setFormGuests((current) =>
      current.map((guest, guestIndex) =>
        guestIndex === index ? { ...guest, ...patch } : guest,
      ),
    )
  }

  function updateMenuSelection(index: number, menuDishId: string, dishOptionId: string) {
    setFormGuests((current) =>
      current.map((guest, guestIndex) =>
        guestIndex === index
          ? {
              ...guest,
              menuSelections: {
                ...guest.menuSelections,
                [menuDishId]: dishOptionId,
              },
            }
          : guest,
      ),
    )
  }

  function buildPayload(): RsvpSubmitPayload {
    if (attendingCount === 0) {
      const primary = formGuests[0] ?? createCompanionDraft(1)

      return {
        guests: [
          {
            id: primary.id,
            clientId: primary.clientId,
            role: "primary",
            name: normalizeName(primary, 0),
            email: primary.email.trim() || null,
            phone: primary.phone.trim() || null,
            notes: primary.notes.trim(),
            rsvp: "Declinado",
            menuSelections: [],
          },
        ],
        message: message.trim() ? message.trim() : null,
      }
    }

    return {
      guests: attendingGuests.map((guest, index) => ({
        id: guest.id,
        clientId: guest.clientId,
        role: guest.role,
        name: normalizeName(guest, index),
        email: guest.email.trim() || null,
        phone: guest.phone.trim() || null,
        notes: guest.notes.trim(),
        rsvp: "Confirmado",
        menuSelections: Object.entries(guest.menuSelections)
          .filter(([, dishOptionId]) => Boolean(dishOptionId))
          .map(([menuDishId, dishOptionId]) => ({ menuDishId, dishOptionId })),
      })),
      message: message.trim() ? message.trim() : null,
    }
  }

  function validateCurrentStep() {
    setError(null)

    if (step !== "details") {
      return true
    }

    for (const [index, guest] of attendingGuests.entries()) {
      if (!guest.firstName.trim()) {
        setError(`Añade el nombre del asistente ${index + 1}.`)
        return false
      }

      if (guest.role === "companion" && !guest.lastName.trim()) {
        setError(`Añade los apellidos de ${guest.firstName || `acompañante ${index + 1}`}.`)
        return false
      }

      if (guest.email.trim() && !isEmail(guest.email.trim())) {
        setError(`Revisa el email de ${guest.firstName || `asistente ${index + 1}`}.`)
        return false
      }

      if (guest.role === "primary" && !guest.email.trim() && !guest.phone.trim()) {
        setError("Añade un email o teléfono para poder contactar contigo.")
        return false
      }
    }

    return true
  }

  function goNext() {
    if (!validateCurrentStep()) {
      return
    }

    const nextStep = steps[stepIndex + 1]

    if (nextStep && nextStep !== "summary") {
      setStep(nextStep)
    }
  }

  function goBack() {
    const previousStep = steps[stepIndex - 1]

    if (previousStep) {
      setError(null)
      setStep(previousStep)
    }
  }

  async function submitResponse() {
    if (!validateCurrentStep()) {
      return
    }

    const payload = buildPayload()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = onSubmit ? await onSubmit(payload) : { guests }

      if (response?.guests) {
        setFormGuests(normalizeGuests(response.guests))
      }

      setSubmittedPayload(payload)
      setStep("summary")
    } catch {
      setError(
        preview
          ? "No se pudo simular la respuesta."
          : "No se pudo guardar la respuesta. Inténtalo de nuevo.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (step === "summary") {
      return
    }

    if (step === "message") {
      void submitResponse()
      return
    }

    goNext()
  }

  function editReply() {
    setSubmittedPayload(null)
    setError(null)
    setStep("attendance")
    setDesktopOpen(true)
    setMobileOpen(true)
  }

  function openDesktopForm() {
    setDesktopOpen(true)
    setError(null)
  }

  const form = (variant: "desktop" | "mobile", closeButton: ReactNode) => (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative z-10 flex min-h-full flex-col",
        variant === "desktop" ? "h-full px-5 py-5" : "px-4 py-5 sm:px-7",
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <div className="flex items-center justify-between gap-4">
          {step !== "attendance" && step !== "summary" ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-12 items-center gap-3 rounded-[6px] border border-black/15 bg-white px-5 text-base font-medium text-[#4f5048] shadow-[0_8px_20px_rgba(48,42,32,0.18)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55564d]"
            >
              <ArrowLeftCircle className="h-6 w-6" aria-hidden="true" />
              Atrás
            </button>
          ) : (
            <span />
          )}

          {closeButton}
        </div>

        <section
          className={cn(
            "mx-auto mt-5 w-full rounded-[8px] bg-[#f3eadf]/95 px-5 py-6 text-[#4f5048] shadow-[0_24px_80px_rgba(72,48,24,0.22)] sm:px-8",
            variant === "desktop" && "overflow-y-auto overscroll-contain lg:max-h-[calc(100svh-8rem)]",
          )}
        >
          {variant === "mobile" ? (
            <Drawer.Title className="text-center text-4xl font-bold tracking-[0.02em] text-[var(--invite-accent)] [font-family:var(--invite-title-font)]">
              {step === "summary" ? "Respuesta recibida" : "RSVP"}
            </Drawer.Title>
          ) : (
            <h2 className="text-center text-4xl font-bold tracking-[0.02em] text-[var(--invite-accent)] [font-family:var(--invite-title-font)]">
              {step === "summary" ? "Respuesta recibida" : "RSVP"}
            </h2>
          )}
          {variant === "mobile" ? (
            <Drawer.Description className="sr-only">
              Formulario de confirmación de asistencia por pasos.
            </Drawer.Description>
          ) : null}

          <div className="mt-6 h-px bg-[#56574f]" />
          <div className="mt-4 h-1 rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-[var(--invite-accent)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div
            key={step}
            className="mt-7 animate-[rsvp-step-in_360ms_ease-out] motion-reduce:animate-none"
          >
            {step === "attendance" ? (
              <AttendanceStep
                attendingCount={attendingCount}
                onChange={changeAttendingCount}
              />
            ) : null}

            {step === "details" ? (
              <DetailsStep guests={attendingGuests} onUpdate={updateGuest} />
            ) : null}

            {step === "menu" && menu ? (
              <MenuStep
                guests={attendingGuests}
                menu={menu}
                onUpdate={updateMenuSelection}
              />
            ) : null}

            {step === "allergies" ? (
              <AllergiesStep guests={attendingGuests} onUpdate={updateGuest} />
            ) : null}

            {step === "message" ? (
              <MessageStep
                message={message}
                attendingCount={attendingCount}
                onChange={setMessage}
              />
            ) : null}

            {step === "summary" ? (
              <SummaryStep
                attendingCount={attendeeNames.length}
                attendeeNames={attendeeNames}
                confirmationCode={confirmationCode}
                message={submittedPayload?.message ?? null}
                onEdit={editReply}
              />
            ) : null}
          </div>

          {error ? (
            <p
              className="mt-6 rounded-[6px] border border-[#9b4d3f]/25 bg-[#9b4d3f]/10 px-4 py-3 text-sm font-medium text-[#7f4a3b]"
              aria-live="polite"
            >
              {error}
            </p>
          ) : null}
        </section>

        {step === "summary" ? null : (
          <div className="sticky bottom-3 z-10 mt-5 flex justify-center pb-[env(safe-area-inset-bottom,0px)]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-14 items-center justify-center gap-4 rounded-[8px] border border-black/15 bg-white px-8 text-lg font-medium text-[#4f5048] shadow-[0_10px_24px_rgba(48,42,32,0.18)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55564d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              )}
              {step === "message" ? "Enviar respuesta" : "Continuar"}
            </button>
          </div>
        )}
      </div>
    </form>
  )

  return (
    <>
      <div
        className={cn(
          "hidden h-full w-full overflow-hidden lg:grid",
          panelMotion === "slide-left"
            ? "grid-cols-[minmax(0,1fr)]"
            : "grid-rows-[minmax(0,1fr)]",
        )}
        data-rsvp-open={desktopOpen}
      >
        <div
          className={cn(
            "flex h-full items-start justify-center px-8 pt-20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
            desktopOpen && panelMotion === "slide-up" && "-translate-y-12 opacity-0",
            desktopOpen && panelMotion === "slide-left" && "-translate-x-12 opacity-0",
          )}
          aria-hidden={desktopOpen}
        >
          <div className="w-full max-w-[520px] rounded-[6px] bg-[color-mix(in_srgb,var(--invite-section)_94%,white)] px-8 py-10 text-center shadow-[0_26px_70px_rgba(71,48,23,0.20)]">
            <h2 className="text-4xl font-bold leading-tight text-[var(--invite-accent)] [font-family:var(--invite-title-font)]">
              {title}
            </h2>
            <p className="mt-6 leading-7 text-[var(--invite-accent-dark)]">{subtitle}</p>
            <button
              type="button"
              onClick={openDesktopForm}
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-[6px] bg-white px-7 py-3 text-sm font-bold uppercase tracking-[0.10em] text-[var(--invite-text)] shadow-[0_12px_28px_rgba(60,42,24,0.18)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--invite-accent-dark)]"
            >
              Confirmar asistencia
            </button>
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
            desktopOpen
              ? "translate-x-0 translate-y-0 opacity-100"
              : panelMotion === "slide-left"
                ? "translate-x-full opacity-0"
                : "translate-y-full opacity-0",
          )}
        >
          {desktopOpen
            ? form(
                "desktop",
                <button
                  type="button"
                  onClick={() => setDesktopOpen(false)}
                  aria-label="Cerrar formulario RSVP"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[#4f5048] shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55564d]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>,
              )
            : null}
        </div>
      </div>

      <Drawer.Root
        open={mobileOpen}
        onOpenChange={(nextOpen) => setMobileOpen(nextOpen)}
        swipeDirection="down"
      >
        <Drawer.Trigger className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 inline-flex min-h-12 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-center rounded-[6px] bg-[var(--invite-accent)] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--invite-accent-text)] shadow-[0_14px_32px_rgba(60,42,24,0.24)] transition-transform hover:-translate-x-1/2 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--invite-accent-dark)] lg:hidden">
          Confirmar asistencia
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-black opacity-[calc(0.26*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 motion-reduce:transition-none supports-[-webkit-touch-callout:none]:absolute" />
          <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
            <Drawer.Popup className="relative max-h-[calc(96svh+3rem)] w-full overflow-y-auto overscroll-contain rounded-t-[18px] bg-[#efe5da] pb-12 text-[#4f5048] shadow-[0_-24px_70px_rgba(58,36,18,0.26)] outline-none [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[520ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:[transform:translateY(calc(100%+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*420ms)] data-starting-style:[transform:translateY(calc(100%+2px))] data-swiping:select-none motion-reduce:transition-none">
              <FloralBackdrop />
              <div className="relative z-10 mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#4f5048]/25" />
              <Drawer.Content>
                {form(
                  "mobile",
                  <Drawer.Close
                    type="button"
                    aria-label="Cerrar formulario RSVP"
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[#4f5048] shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55564d]"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </Drawer.Close>,
                )}
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}

function AttendanceStep({
  attendingCount,
  onChange,
}: {
  attendingCount: number
  onChange: (count: number) => void
}) {
  return (
    <div className="grid gap-10">
      <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-3xl font-bold text-[var(--invite-accent)]">
            Asistirán
          </p>
          <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[#6a695f]">
            Puedes añadir los acompañantes que necesites
          </p>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => onChange(attendingCount - 1)}
            disabled={attendingCount === 0}
            className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#55564d] text-[#55564d] transition-colors hover:bg-white disabled:opacity-35"
          >
            <Minus className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">Restar asistente</span>
          </button>
          <output className="grid h-20 w-28 place-items-center rounded-[8px] border-2 border-[#55564d] text-5xl font-bold text-[var(--invite-accent)]">
            {attendingCount}
          </output>
          <button
            type="button"
            onClick={() => onChange(attendingCount + 1)}
            className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#55564d] text-[#55564d] transition-colors hover:bg-white"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">Sumar asistente</span>
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-6 text-2xl font-bold text-[var(--invite-accent)]">
        No podremos asistir
        <input
          type="checkbox"
          checked={attendingCount === 0}
          onChange={(event) => onChange(event.target.checked ? 0 : 1)}
          className="h-11 w-11 appearance-none rounded-[8px] border-4 border-[#55564d] bg-transparent transition-colors checked:bg-[var(--invite-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55564d]"
        />
      </label>
    </div>
  )
}

function DetailsStep({
  guests,
  onUpdate,
}: {
  guests: EditableGuest[]
  onUpdate: (index: number, patch: Partial<EditableGuest>) => void
}) {
  return (
    <div>
      <h3 className="text-3xl leading-tight text-[var(--invite-accent)]">
        Datos de los asistentes
      </h3>
      <div className="mt-7 grid gap-7">
        {guests.map((guest, index) => (
          <fieldset key={guest.localId} className="grid gap-4">
            <legend className="text-xl font-bold text-[var(--invite-accent)]">
              {guest.role === "primary" ? "Invitado" : `Acompañante ${index}`}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Nombre"
                value={guest.firstName}
                autoComplete="given-name"
                onChange={(value) => onUpdate(index, { firstName: value })}
              />
              <TextInput
                label="Apellidos"
                value={guest.lastName}
                autoComplete="family-name"
                onChange={(value) => onUpdate(index, { lastName: value })}
              />
            </div>

            {guest.role === "primary" ? (
              <div className="grid gap-3">
                <div className="inline-grid w-fit grid-cols-2 rounded-[8px] border border-[#55564d]/40 bg-white/30 p-1">
                  {(["email", "phone"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdate(index, { contactPreference: mode })}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded-[6px] px-4 text-sm font-bold uppercase tracking-[0.08em]",
                        guest.contactPreference === mode
                          ? "bg-[var(--invite-accent)] text-[var(--invite-accent-text)]"
                          : "text-[#55564d]",
                      )}
                    >
                      {mode === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                      {mode === "email" ? "Email" : "Teléfono"}
                    </button>
                  ))}
                </div>
                {guest.contactPreference === "email" ? (
                  <TextInput
                    label="Email"
                    type="email"
                    value={guest.email}
                    autoComplete="email"
                    icon={<Mail className="h-7 w-7" aria-hidden="true" />}
                    onChange={(value) => onUpdate(index, { email: value })}
                  />
                ) : (
                  <TextInput
                    label="Teléfono"
                    type="tel"
                    value={guest.phone}
                    autoComplete="tel"
                    icon={<Phone className="h-7 w-7" aria-hidden="true" />}
                    onChange={(value) => onUpdate(index, { phone: value })}
                  />
                )}
              </div>
            ) : (
              <div>
                <TextInput
                  label="Email opcional"
                  type="email"
                  value={guest.email}
                  autoComplete="email"
                  icon={<Mail className="h-7 w-7" aria-hidden="true" />}
                  onChange={(value) => onUpdate(index, { email: value })}
                />
                <p className="mt-2 text-sm leading-5 text-[#6a695f]">
                  Opcional. Lo usaremos para que pueda subir fotos de la boda.
                </p>
              </div>
            )}
          </fieldset>
        ))}
      </div>
    </div>
  )
}

function MenuStep({
  guests,
  menu,
  onUpdate,
}: {
  guests: EditableGuest[]
  menu: PublicInvitationMenuDto
  onUpdate: (index: number, menuDishId: string, dishOptionId: string) => void
}) {
  return (
    <div>
      <h3 className="text-3xl leading-tight text-[var(--invite-accent)]">
        Selecciona el plato de cada asistente
      </h3>
      <div className="mt-7 grid gap-7">
        {guests.map((guest, index) => (
          <fieldset key={guest.localId} className="grid gap-5">
            <legend className="text-xl font-bold text-[var(--invite-accent)]">
              {normalizeName(guest, index)}
            </legend>
            {menu.dishes.map((dish) => (
              <div key={dish.id} className="grid gap-3">
                <p className="text-sm uppercase tracking-[0.16em] text-[#6a695f]">
                  {dish.name}
                </p>
                <div className="grid gap-2">
                  {dish.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#55564d]/35 bg-white/25 px-4 py-3 text-[#4f5048]"
                    >
                      <input
                        type="radio"
                        name={`${guest.localId}-${dish.id}`}
                        checked={guest.menuSelections[dish.id] === option.id}
                        onChange={() => onUpdate(index, dish.id, option.id)}
                        className="mt-1 h-5 w-5 accent-[var(--invite-accent)]"
                      />
                      <span>
                        <span className="block text-lg font-bold text-[var(--invite-accent)]">
                          {option.name}
                        </span>
                        {option.description ? (
                          <span className="mt-1 block text-sm leading-5 text-[#6a695f]">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        ))}
      </div>
    </div>
  )
}

function AllergiesStep({
  guests,
  onUpdate,
}: {
  guests: EditableGuest[]
  onUpdate: (index: number, patch: Partial<EditableGuest>) => void
}) {
  return (
    <div>
      <h3 className="text-3xl leading-tight text-[var(--invite-accent)]">
        ¿Hay alergias o restricciones alimentarias?
      </h3>
      <div className="mt-7 grid gap-7">
        {guests.map((guest, index) => (
          <label
            key={guest.localId}
            className="grid gap-3 text-xl font-bold text-[var(--invite-accent)]"
          >
            {normalizeName(guest, index)}
            <textarea
              value={guest.notes}
              onChange={(event) => onUpdate(index, { notes: event.target.value })}
              placeholder="Sin alergias, vegetariano, intolerancias..."
              rows={2}
              className="min-h-24 resize-y rounded-[8px] border-2 border-[#55564d] bg-transparent px-5 py-4 text-xl font-normal text-[#1d1d1b] outline-none placeholder:text-[var(--invite-accent)]/55 focus:border-[var(--invite-accent)] focus:bg-white/30"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function MessageStep({
  message,
  attendingCount,
  onChange,
}: {
  message: string
  attendingCount: number
  onChange: (value: string) => void
}) {
  return (
    <div>
      <h3 className="text-3xl leading-tight text-[var(--invite-accent)] sm:text-4xl">
        {attendingCount > 0
          ? "¿Quieres dejar un mensaje a los novios?"
          : "¿Quieres dejarles un mensaje?"}
      </h3>
      <textarea
        value={message}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Escribe aquí..."
        rows={4}
        className="mt-7 min-h-32 w-full resize-y rounded-[8px] border-2 border-[#55564d] bg-transparent px-5 py-4 text-2xl text-[#1d1d1b] outline-none placeholder:text-[var(--invite-accent)]/55 focus:border-[var(--invite-accent)] focus:bg-white/30"
      />
    </div>
  )
}

function SummaryStep({
  attendingCount,
  attendeeNames,
  confirmationCode,
  message,
  onEdit,
}: {
  attendingCount: number
  attendeeNames: string[]
  confirmationCode: string
  message: string | null
  onEdit: () => void
}) {
  return (
    <div className="text-center">
      <h3 className="text-4xl leading-tight text-[var(--invite-accent)]">
        Gracias por tu respuesta
      </h3>
      <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-[var(--invite-accent-dark)]">
        {attendingCount > 0
          ? "Nos hace mucha ilusión contar contigo."
          : "Sentimos que no puedas acompañarnos. Gracias por avisarnos."}
      </p>

      <div className="mt-9 rounded-[8px] bg-[#f8f1e8]/90 px-5 py-7 shadow-inner">
        <p className="text-sm uppercase tracking-[0.22em] text-[var(--invite-accent)]">
          Código de confirmación
        </p>
        <p className="mt-2 text-4xl font-black tracking-[0.08em] text-[var(--invite-accent)]">
          {confirmationCode}
        </p>
        <div className="mt-7 divide-y divide-[#55564d]/70 text-left">
          {attendeeNames.length ? (
            attendeeNames.map((name) => (
              <p
                key={name}
                className="flex items-center justify-between gap-4 py-4 text-xl font-bold text-[var(--invite-accent)]"
              >
                {name}
                <CheckCircle2 className="h-7 w-7 text-[#55564d]" />
              </p>
            ))
          ) : (
            <p className="py-4 text-xl font-bold text-[var(--invite-accent)]">
              No podremos asistir
            </p>
          )}
        </div>
        {message ? (
          <p className="mt-5 rounded-[6px] bg-white/60 px-4 py-3 text-left text-base leading-7 text-[#55564d]">
            {message}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-[8px] bg-white px-7 text-lg font-medium text-[#4f5048] shadow-[0_10px_24px_rgba(48,42,32,0.18)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55564d]"
      >
        <Pencil className="h-6 w-6" aria-hidden="true" />
        Editar respuesta
      </button>
    </div>
  )
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  icon,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email" | "tel"
  autoComplete?: string
  icon?: ReactNode
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold uppercase tracking-[0.12em] text-[#6a695f]">
        {label}
      </span>
      <span className="relative block">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          autoComplete={autoComplete}
          className={cn(
            "min-h-16 w-full rounded-[8px] border-2 border-[#55564d] bg-transparent px-5 text-2xl text-[#1d1d1b] outline-none placeholder:text-[var(--invite-accent)]/65 focus:border-[var(--invite-accent)] focus:bg-white/30",
            icon && "pr-14",
          )}
        />
        {icon ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#55564d]/55">
            {icon}
          </span>
        ) : null}
      </span>
    </label>
  )
}

function FloralBackdrop() {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-75"
        style={{ backgroundImage: "url('/images/invite-floral.png')" }}
      />
      <div className="absolute inset-0 bg-[#e7c59a]/20 backdrop-blur-[1px]" />
    </>
  )
}

function normalizeGuests(guests: PublicInvitationGuestDto[]): EditableGuest[] {
  const sortedGuests = [...guests].sort((a, b) => {
    if (a.role === b.role) {
      return a.name.localeCompare(b.name)
    }

    return a.role === "primary" ? -1 : 1
  })

  return sortedGuests.map((guest, index) => {
    const [firstName, ...lastNameParts] = guest.name.trim().split(/\s+/)

    return {
      localId: guest.id,
      id: guest.id,
      role: guest.role,
      firstName: firstName || `Invitado ${index + 1}`,
      lastName: lastNameParts.join(" "),
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      contactPreference: guest.email || !guest.phone ? "email" : "phone",
      notes: guest.notes ?? "",
      rsvp: guest.rsvp,
      menuSelections: Object.fromEntries(
        guest.menuSelections.map((selection) => [
          selection.menuDishId,
          selection.dishOptionId,
        ]),
      ),
    }
  })
}

function initialAttendingCount(guests: PublicInvitationGuestDto[]) {
  const confirmed = guests.filter((guest) => guest.rsvp === "Confirmado").length

  if (confirmed > 0) {
    return confirmed
  }

  if (guests.length && guests.every((guest) => guest.rsvp === "Declinado")) {
    return 0
  }

  return Math.max(guests.length, 1)
}

function createCompanionDraft(position: number): EditableGuest {
  const clientId = `companion-${position}-${Date.now()}`

  return {
    localId: clientId,
    clientId,
    role: "companion",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    contactPreference: "email",
    notes: "",
    rsvp: "Sin respuesta",
    menuSelections: {},
  }
}

function normalizeName(guest: EditableGuest, index: number) {
  const name = [guest.firstName, guest.lastName].map((part) => part.trim()).filter(Boolean).join(" ")

  return name || `Asistente ${index + 1}`
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getConfirmationCode(seed: string) {
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }

  return hash.toString(36).toUpperCase().padStart(6, "0").slice(0, 8)
}
