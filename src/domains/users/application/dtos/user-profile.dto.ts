import { z } from "zod"

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  lastName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
})

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>

export const changeEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email no válido"),
})

export type ChangeEmailDto = z.infer<typeof changeEmailSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Introduce tu contraseña actual"),
  newPassword: z.string().min(7, "Mínimo 7 caracteres"),
})

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>

export interface ProfileActionResult {
  ok: boolean
  message: string
}
