import { z } from "zod"

const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email("Introduce un email válido."),
)

const passwordSchema = z
  .string()
  .min(7, "La contraseña debe tener al menos 7 caracteres.")
  .regex(/[A-Za-z]/, "Incluye al menos una letra.")
  .regex(/[0-9]/, "Incluye al menos un número.")

export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const signupFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(80, "El nombre no puede superar 80 caracteres."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma la contraseña."),
  })
  .check((ctx) => {
    if (ctx.value.password !== ctx.value.confirmPassword) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value.confirmPassword,
        message: "Las contraseñas no coinciden.",
        path: ["confirmPassword"],
      })
    }
  })

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type SignupFormValues = z.infer<typeof signupFormSchema>
