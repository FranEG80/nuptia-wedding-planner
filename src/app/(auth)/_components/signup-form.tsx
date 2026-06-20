"use client"

import { useRef, useState } from "react"
import { UserPlus } from "lucide-react"

import { AuthFormField } from "@/app/(auth)/_components/auth-form-field"
import {
  signupFormSchema,
  type SignupFormValues,
} from "@/core/auth/auth-form-schemas"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"

type SignupField = keyof SignupFormValues
type SignupErrors = Partial<Record<SignupField, string[]>>
type SignupTouched = Partial<Record<SignupField, boolean>>

const initialValues: SignupFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}

const signupFields = [
  "name",
  "email",
  "password",
  "confirmPassword",
] as const satisfies readonly SignupField[]

function collectSignupErrors(
  values: SignupFormValues,
  visibleFields: readonly SignupField[],
) {
  const parsed = signupFormSchema.safeParse(values)

  if (parsed.success) {
    return {}
  }

  const fieldErrors = parsed.error.flatten().fieldErrors as SignupErrors

  return visibleFields.reduce<SignupErrors>((errors, field) => {
    if (fieldErrors[field]?.length) {
      errors[field] = fieldErrors[field]
    }

    return errors
  }, {})
}

function visibleSignupFields(touched: SignupTouched, includeAll: boolean) {
  if (includeAll) {
    return signupFields
  }

  return signupFields.filter((field) => touched[field])
}

function firstSignupErrorField(errors: SignupErrors) {
  return signupFields.find((field) => errors[field]?.length)
}

export function SignupForm() {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<SignupErrors>({})
  const [status, setStatus] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState<SignupTouched>({})
  const [values, setValues] = useState<SignupFormValues>(initialValues)

  const inputRefs = {
    name: nameRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmPasswordRef,
  } satisfies Record<SignupField, React.RefObject<HTMLInputElement | null>>

  function validateVisibleFields(
    nextValues: SignupFormValues,
    nextTouched: SignupTouched,
  ) {
    const nextErrors = collectSignupErrors(
      nextValues,
      visibleSignupFields(nextTouched, submitted),
    )
    setErrors(nextErrors)
  }

  function updateValue(field: SignupField, value: string) {
    const nextValues = { ...values, [field]: value }

    setValues(nextValues)
    setStatus("")

    if (submitted || touched[field]) {
      validateVisibleFields(nextValues, touched)
    }
  }

  function markTouched(field: SignupField) {
    const nextTouched = { ...touched, [field]: true }

    setTouched(nextTouched)
    validateVisibleFields(values, nextTouched)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    const nextErrors = collectSignupErrors(values, signupFields)
    setErrors(nextErrors)

    const firstError = firstSignupErrorField(nextErrors)

    if (firstError) {
      inputRefs[firstError].current?.focus()
      setStatus("Revisa los campos marcados antes de continuar.")
      return
    }

    setStatus("Formulario validado. La creación de cuenta se conectará más adelante.")
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      <AuthFormField
        id="signup-name"
        name="name"
        label="Nombre"
        error={errors.name?.[0]}
      >
        <Input
          ref={nameRef}
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onBlur={() => markTouched("name")}
          onChange={(event) => updateValue("name", event.currentTarget.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          className="h-11 px-3"
          placeholder="Tu nombre"
        />
      </AuthFormField>

      <AuthFormField
        id="signup-email"
        name="email"
        label="Email"
        error={errors.email?.[0]}
      >
        <Input
          ref={emailRef}
          id="signup-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.email}
          onBlur={() => markTouched("email")}
          onChange={(event) => updateValue("email", event.currentTarget.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          className="h-11 px-3"
          placeholder="tu@email.com"
        />
      </AuthFormField>

      <AuthFormField
        id="signup-password"
        name="password"
        label="Contraseña"
        description="Mínimo 8 caracteres, con una letra y un número."
        error={errors.password?.[0]}
      >
        <Input
          ref={passwordRef}
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onBlur={() => markTouched("password")}
          onChange={(event) => updateValue("password", event.currentTarget.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password
              ? "signup-password-error signup-password-description"
              : "signup-password-description"
          }
          className="h-11 px-3"
          placeholder="Crea una contraseña"
        />
      </AuthFormField>

      <AuthFormField
        id="signup-confirm-password"
        name="confirmPassword"
        label="Confirmar contraseña"
        error={errors.confirmPassword?.[0]}
      >
        <Input
          ref={confirmPasswordRef}
          id="signup-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onBlur={() => markTouched("confirmPassword")}
          onChange={(event) =>
            updateValue("confirmPassword", event.currentTarget.value)
          }
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword ? "signup-confirm-password-error" : undefined
          }
          className="h-11 px-3"
          placeholder="Repite la contraseña"
        />
      </AuthFormField>

      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {status}
      </p>

      <Button type="submit" size="lg" className="h-11 w-full">
        <UserPlus data-icon="inline-start" />
        Crear cuenta
      </Button>
    </form>
  )
}
