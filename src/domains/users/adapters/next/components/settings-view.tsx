"use client"

import { useState, useTransition, type FormEvent } from "react"
import { KeyRound, Loader2, Save, User } from "lucide-react"

import {
  changeEmailAction,
  changePasswordAction,
  updateProfileAction,
} from "@/domains/users/adapters/next/actions"
import { cn } from "@/shared/lib/utils"

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Icon className="h-4.5 w-4.5 text-muted-foreground" strokeWidth={1.75} />
        <h2 className="font-serif text-xl text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted-foreground">{label}</span>
      <input
        {...props}
        className={cn(
          "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent",
          props.className,
        )}
      />
    </label>
  )
}

function Feedback({ message, ok }: { message: string; ok: boolean }) {
  return (
    <p className={cn("mt-3 text-sm", ok ? "text-emerald-600" : "text-destructive")}>
      {message}
    </p>
  )
}

export function SettingsView({
  name,
  lastName,
  phone,
  email,
  isDemo,
}: {
  name: string
  lastName: string
  phone: string
  email: string
  isDemo: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [profileFeedback, setProfileFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [emailFeedback, setEmailFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [passwordFeedback, setPasswordFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await updateProfileAction({
        name: formData.get("name"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
      })
      setProfileFeedback(result)
    })
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await changeEmailAction({ email: formData.get("email") })
      setEmailFeedback(result)
    })
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
      })
      setPasswordFeedback(result)

      if (result.ok) {
        event.currentTarget?.reset()
      }
    })
  }

  return (
    <div className="space-y-6">
      {isDemo && (
        <p className="rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          Estás en modo demo: los cambios de esta sección no se guardarán.
        </p>
      )}

      <Section icon={User} title="Datos personales">
        <form onSubmit={handleProfileSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" name="name" defaultValue={name} required />
          <Field label="Apellidos" name="lastName" defaultValue={lastName} />
          <Field label="Teléfono" name="phone" type="tel" defaultValue={phone} />
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar datos
            </button>
          </div>
        </form>
        {profileFeedback && <Feedback {...profileFeedback} />}
      </Section>

      <Section icon={User} title="Email">
        <form onSubmit={handleEmailSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" name="email" type="email" defaultValue={email} required />
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Actualizar email
            </button>
          </div>
        </form>
        {emailFeedback && <Feedback {...emailFeedback} />}
      </Section>

      <Section icon={KeyRound} title="Contraseña">
        <form onSubmit={handlePasswordSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Contraseña actual"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
          <Field
            label="Nueva contraseña"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={7}
            required
          />
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Cambiar contraseña
            </button>
          </div>
        </form>
        {passwordFeedback && <Feedback {...passwordFeedback} />}
      </Section>
    </div>
  )
}
