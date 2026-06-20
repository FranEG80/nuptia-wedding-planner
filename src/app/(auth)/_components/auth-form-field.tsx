"use client"

import { Field } from "@base-ui/react/field"

export function AuthFormField({
  children,
  description,
  error,
  id,
  label,
  name,
}: {
  children: React.ReactNode
  description?: string
  error?: string
  id: string
  label: string
  name: string
}) {
  return (
    <Field.Root name={name} invalid={Boolean(error)} className="space-y-2">
      <Field.Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Field.Label>
      {children}
      {description ? (
        <Field.Description
          id={`${id}-description`}
          className="text-xs leading-5 text-muted-foreground"
        >
          {description}
        </Field.Description>
      ) : null}
      <Field.Error
        id={`${id}-error`}
        match={Boolean(error)}
        role="alert"
        className="text-sm leading-5 text-destructive"
      >
        {error}
      </Field.Error>
    </Field.Root>
  )
}
