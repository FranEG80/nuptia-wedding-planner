"use client"

import { useActionState, useRef, useState } from "react"
import { FlaskConical, LogIn } from "lucide-react"

import { AuthFormField } from "@/app/(auth)/_components/auth-form-field"
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/core/auth/auth-form-schemas"
import { loginAction, signInDemoAction } from "@/core/auth/actions"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"

type LoginField = keyof LoginFormValues
type LoginErrors = Partial<Record<LoginField, string[]>>
type LoginTouched = Partial<Record<LoginField, boolean>>

const initialValues: LoginFormValues = {
  email: "",
  password: "",
}

const loginFields = ["email", "password"] as const satisfies readonly LoginField[]

function collectLoginErrors(
  values: LoginFormValues,
  visibleFields: readonly LoginField[],
) {
  const parsed = loginFormSchema.safeParse(values)

  if (parsed.success) {
    return {}
  }

  const fieldErrors = parsed.error.flatten().fieldErrors as LoginErrors

  return visibleFields.reduce<LoginErrors>((errors, field) => {
    if (fieldErrors[field]?.length) {
      errors[field] = fieldErrors[field]
    }

    return errors
  }, {})
}

function visibleLoginFields(touched: LoginTouched, includeAll: boolean) {
  if (includeAll) {
    return loginFields
  }

  return loginFields.filter((field) => touched[field])
}

function firstLoginErrorField(errors: LoginErrors) {
  return loginFields.find((field) => errors[field]?.length)
}

export function LoginForm() {
  const [actionState, formAction, pending] = useActionState(
    loginAction,
    { message: "" },
  )
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [status, setStatus] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState<LoginTouched>({})
  const [values, setValues] = useState<LoginFormValues>(initialValues)

  const inputRefs = {
    email: emailRef,
    password: passwordRef,
  } satisfies Record<LoginField, React.RefObject<HTMLInputElement | null>>

  function validateVisibleFields(nextValues: LoginFormValues, nextTouched: LoginTouched) {
    const nextErrors = collectLoginErrors(
      nextValues,
      visibleLoginFields(nextTouched, submitted),
    )
    setErrors(nextErrors)
  }

  function updateValue(field: LoginField, value: string) {
    const nextValues = { ...values, [field]: value }

    setValues(nextValues)
    setStatus("")

    if (submitted || touched[field]) {
      validateVisibleFields(nextValues, touched)
    }
  }

  function markTouched(field: LoginField) {
    const nextTouched = { ...touched, [field]: true }

    setTouched(nextTouched)
    validateVisibleFields(values, nextTouched)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setSubmitted(true)

    const nextErrors = collectLoginErrors(values, loginFields)
    setErrors(nextErrors)

    const firstError = firstLoginErrorField(nextErrors)

    if (firstError) {
      event.preventDefault()
      inputRefs[firstError].current?.focus()
      setStatus("Revisa los campos marcados antes de continuar.")
      return
    }

    setStatus("Comprobando tus datos…")
  }

  return (
    <>
      <form
        action={formAction}
        className="mt-8 space-y-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <AuthFormField
          id="login-email"
          name="email"
          label="Email"
          error={errors.email?.[0]}
        >
          <Input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onBlur={() => markTouched("email")}
            onChange={(event) => updateValue("email", event.currentTarget.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className="h-11 px-3"
            placeholder="tu@email.com"
          />
        </AuthFormField>

        <AuthFormField
          id="login-password"
          name="password"
          label="Contraseña"
          error={errors.password?.[0]}
        >
          <Input
            ref={passwordRef}
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onBlur={() => markTouched("password")}
            onChange={(event) =>
              updateValue("password", event.currentTarget.value)
            }
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "login-password-error" : undefined
            }
            className="h-11 px-3"
            placeholder="Tu contraseña"
          />
        </AuthFormField>

        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {actionState.message || status}
        </p>

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full"
          disabled={pending}
        >
          <LogIn data-icon="inline-start" />
          {pending ? "Accediendo…" : "Acceder"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o prueba el panel
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInDemoAction}>
        <Button
          type="submit"
          variant="outline"
          size="lg"
          className="h-11 w-full"
        >
          <FlaskConical data-icon="inline-start" />
          Probar demo
        </Button>
      </form>
    </>
  )
}
