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
import { cn } from "@/shared/lib/utils"

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

const fieldsetBase = "grid mb-4 p-[1.2rem] border border-[rgba(91,77,71,0.18)] rounded-2xl gap-[0.7rem]"
const legendBase = "px-[0.4rem] [font-family:var(--font-cormorant),serif] text-[1.25rem] font-bold"
const labelBase = "flex text-[rgba(91,77,71,0.78)] text-[0.68rem] font-extrabold tracking-[0.05em] flex-col gap-[0.4rem]"
const inputBase = "w-full py-[0.78rem] px-[0.85rem] border border-[rgba(91,77,71,0.22)] rounded-[0.7rem] outline-none bg-[rgba(255,255,255,0.6)] text-inherit [font-family:inherit] leading-[inherit] text-[0.82rem] font-medium tracking-normal focus:border-[#d5764d]"
const actionButtonBase = "py-[0.85rem] px-[1.2rem] border border-[#5b4d47] rounded-full bg-transparent text-inherit text-[0.68rem] font-extrabold tracking-[0.08em] cursor-pointer last:bg-[#5b4d47] last:text-white disabled:opacity-60 disabled:cursor-wait"
const attendanceButtonBase = "py-[0.85rem] px-4 border border-[rgba(91,77,71,0.18)] rounded-full bg-[rgba(255,255,255,0.45)] text-inherit text-[0.75rem] cursor-pointer"

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
      <Dialog.Trigger
        type="button"
        aria-label="Confirmar asistencia"
        className="group relative block w-[min(20rem,86vw)] min-h-[8.5rem] border-0 bg-transparent text-[#5b4d47] cursor-pointer focus-visible:outline-2 focus-visible:outline-[rgba(91,77,71,0.55)] focus-visible:outline-offset-4"
        onClick={() => setOpen(true)}
      >
        <Image draggable="false"
          src={mariaDanielaAssets.buttonOutline}
          alt=""
          fill
          sizes="320px"
          className="z-0 object-contain transition-transform duration-[250ms] ease-out group-hover:rotate-[-1deg] group-hover:scale-[1.025] group-focus-visible:rotate-[-1deg] group-focus-visible:scale-[1.025]"
          unoptimized
        />
        <span className="absolute inset-0 z-[1] flex items-center justify-center -translate-y-[14.4%] [font-family:var(--font-quicksand),sans-serif] text-[clamp(1.9rem,5vw,2.35rem)] font-normal tracking-[0.01em] leading-none text-[#d5764d]">CONFIRMAR</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-[rgba(57,47,43,0.72)] backdrop-blur-[8px] animate-[rsvp-modal-fade_0.25s_ease-out] motion-reduce:animate-none" />
        <Dialog.Viewport className="fixed inset-0 z-[81] grid p-4 place-items-center overflow-y-auto max-[700px]:p-0 max-[700px]:items-end max-[700px]:justify-items-center">
          <Dialog.Popup className="grid w-[min(980px,100%)] max-h-[min(760px,calc(100svh_-_2rem))] overflow-hidden rounded-3xl bg-[#fbf4ea] text-[#5b4d47] shadow-[0_35px_100px_rgba(57,47,43,0.3)] grid-cols-[35%_65%] animate-[rsvp-modal-enter_0.35s_cubic-bezier(.22,1,.36,1)] motion-reduce:animate-none max-[700px]:w-full max-[700px]:max-h-[94svh] max-[700px]:rounded-t-[1.4rem] max-[700px]:rounded-b-none max-[700px]:grid-cols-1">
            <div className="relative grid min-h-[42rem] place-items-center overflow-hidden bg-[#fff6ee] text-center isolate max-[700px]:hidden">
              <Image draggable="false" src={mariaDanielaAssets.watercolorSides} alt="" fill sizes="360px" className="z-[-1] object-cover opacity-70" />
              <div className="p-8">
                <Image draggable="false" src={step === "success" ? mariaDanielaAssets.discoBallLight : mariaDanielaAssets.checklist} alt="" width={150} height={150} className="w-32 h-auto mx-auto object-contain" />
                <p className="mt-6 mb-[0.8rem] text-[0.64rem] font-black tracking-[0.3em]">RSVP</p>
                <strong className="block [font-family:var(--font-parisienne),cursive] text-[3.2rem] font-normal leading-[0.9]">{title}</strong>
              </div>
            </div>

            <div className="relative flex min-h-[42rem] py-8 px-[clamp(1.3rem,4vw,3.5rem)] flex-col overflow-y-auto max-[700px]:min-h-[80svh] max-[700px]:p-[1.2rem]">
              <Dialog.Close className="self-end py-[0.3rem] border-0 border-b border-current bg-transparent text-inherit text-[0.6rem] font-extrabold tracking-[0.15em] uppercase cursor-pointer" aria-label="Cerrar">Cerrar</Dialog.Close>
              <div className="h-0.5 mt-[1.6rem] mb-[2.8rem] bg-[rgba(91,77,71,0.15)] max-[700px]:mt-[1.1rem] max-[700px]:mb-8" aria-label={`Progreso ${progress}%`}><span className="block h-full bg-[#d5764d] transition-[width] duration-[350ms] ease-out" style={{ width: `${progress}%` }} /></div>

              <Dialog.Title className="m-0 [font-family:var(--font-parisienne),cursive] text-[clamp(3rem,5vw,4.5rem)] font-normal leading-[0.9]">{stepTitle(step)}</Dialog.Title>
              <Dialog.Description className="min-h-[2.8rem] mt-[0.9rem] mb-[1.6rem] text-[rgba(91,77,71,0.66)] [font-family:var(--font-cormorant),serif] text-[1.08rem] leading-[1.4]">
                {step === "attendance" ? subtitle : stepDescription(step)}
              </Dialog.Description>

              <div className="flex-1">
                {step === "attendance" && (
                  <fieldset className={fieldsetBase}>
                    <legend className={legendBase}>¿Quién asistirá?</legend>
                    {demoAttendanceOptions(drafts).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(attendanceButtonBase, demoAttendanceChoice(drafts) === option.value && "border-[#d5764d] bg-[#d5764d] text-white")}
                        onClick={() => changeAttendance(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </fieldset>
                )}

                {step === "details" && attending.map((guest) => (
                  <fieldset key={guest.id} className={cn(fieldsetBase, "grid-cols-2 max-[700px]:grid-cols-1")}>
                    <legend className={cn(legendBase, "col-span-full")}>{guest.name}</legend>
                    <label className={labelBase}>Teléfono{guest.role !== "primary" ? " (opcional)" : ""}<input type="tel" className={inputBase} value={guest.phone} onChange={(event) => updateGuest(guest.id, { phone: event.target.value })} /></label>
                    <label className={labelBase}>Email (opcional)<input type="email" className={inputBase} value={guest.email} onChange={(event) => updateGuest(guest.id, { email: event.target.value })} /></label>
                  </fieldset>
                ))}

                {step === "menu" && attending.map((guest) => (
                  <fieldset key={guest.id} className={cn(fieldsetBase, "grid-cols-2 max-[700px]:grid-cols-1")}>
                    <legend className={cn(legendBase, "col-span-full")}>Menú de {guest.name}</legend>
                    {menu?.dishes.map((dish) => (
                      <label key={dish.id} className={labelBase}>{dish.name}
                        <select className={inputBase} value={guest.menuSelections[dish.id] ?? ""} onChange={(event) => updateGuest(guest.id, { menuSelections: { ...guest.menuSelections, [dish.id]: event.target.value } })}>
                          <option value="">Elegir opción</option>
                          {dish.options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      </label>
                    ))}
                  </fieldset>
                ))}

                {step === "notes" && attending.map((guest) => (
                  <label key={guest.id} className={cn(labelBase, "mb-4")}>Alergias o necesidades de {guest.name}
                    <textarea className={cn(inputBase, "min-h-[7rem] resize-y")} value={guest.notes} onChange={(event) => updateGuest(guest.id, { notes: event.target.value })} placeholder="Cuéntanos cualquier detalle que debamos saber" />
                  </label>
                ))}

                {step === "message" && <label className={cn(labelBase, "mb-4")}>Un mensaje para los novios
                  <textarea className={cn(inputBase, "min-h-[7rem] resize-y")} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escribe aquí tu mensaje (opcional)" />
                </label>}

                {step === "review" && (
                  <div>
                    {drafts.map((guest) => (
                      <p key={guest.id} className="flex m-0 py-4 border-b border-[rgba(91,77,71,0.15)] justify-between">
                        <strong>{guest.name}</strong><span className="text-[#d5764d] text-[0.75rem] font-extrabold">{guest.attending ? "Asistirá" : "No asistirá"}</span>
                      </p>
                    ))}
                    {message && <blockquote className="my-[1.2rem] p-4 border-l-2 border-[#d5764d] [font-family:var(--font-cormorant),serif] text-[1.15rem]">“{message}”</blockquote>}
                  </div>
                )}

                {step === "success" && (
                  <div className="text-center">
                    <p className="[font-family:var(--font-cormorant),serif] text-[1.3rem] leading-[1.55]">{attending.length > 0 ? "¡Gracias por confirmar! Nos hace muchísima ilusión celebrarlo contigo." : "Gracias por avisarnos. Te echaremos de menos."}</p>
                    <Dialog.Close className="mt-8 py-[0.9rem] px-6 border-0 rounded-full bg-[#5b4d47] text-white cursor-pointer">Terminar</Dialog.Close>
                  </div>
                )}
              </div>

              {error && <p className="mt-[0.8rem] mb-0 text-[#a44334] text-[0.75rem]" role="alert">{error}</p>}
              {step !== "success" && (
                <div className="flex mt-6 justify-end gap-[0.7rem]">
                  {index > 0 && <button type="button" className={actionButtonBase} onClick={back}>Anterior</button>}
                  {step === "review" ? (
                    <button type="button" className={actionButtonBase} onClick={confirm} disabled={submitting}>{submitting ? "Guardando…" : "Enviar confirmación"}</button>
                  ) : (
                    <button type="button" className={actionButtonBase} onClick={next}>Continuar</button>
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
