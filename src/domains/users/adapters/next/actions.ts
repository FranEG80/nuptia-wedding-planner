"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { requireAppSession } from "@/core/auth"
import { getAuth } from "@/core/auth/better-auth"
import { getPrisma } from "@/core/db/prisma"
import { isDemoSession } from "@/core/demo/is-demo-session"
import {
  changeEmailSchema,
  changePasswordSchema,
  updateProfileSchema,
  type ProfileActionResult,
} from "@/domains/users/application/dtos/user-profile.dto"

function revalidateProfile() {
  revalidatePath("/app/ajustes")
}

export async function updateProfileAction(
  input: unknown,
): Promise<ProfileActionResult> {
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return { ok: false, message: "No disponible en la cuenta demo." }
  }

  const parsed = updateProfileSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, message: "Revisa los datos introducidos." }
  }

  const { name, lastName, phone } = parsed.data

  if (session.auth.provider === "better-auth") {
    const auth = await getAuth()
    await auth.api.updateUser({
      headers: await headers(),
      body: { name },
    })
  }

  const prisma = await getPrisma()
  await prisma.appUser.update({
    where: { id: session.appUser.id },
    data: {
      name,
      lastName: lastName || null,
      phone: phone || null,
    },
  })

  revalidateProfile()

  return { ok: true, message: "Datos actualizados." }
}

export async function changeEmailAction(
  input: unknown,
): Promise<ProfileActionResult> {
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return { ok: false, message: "No disponible en la cuenta demo." }
  }

  if (session.auth.provider !== "better-auth") {
    return { ok: false, message: "El email se gestiona con tu proveedor de acceso." }
  }

  const parsed = changeEmailSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, message: "Email no válido." }
  }

  try {
    const auth = await getAuth()
    await auth.api.changeEmail({
      headers: await headers(),
      body: { newEmail: parsed.data.email },
    })
  } catch {
    return { ok: false, message: "No se ha podido cambiar el email." }
  }

  const prisma = await getPrisma()
  await prisma.appUser.update({
    where: { id: session.appUser.id },
    data: { email: parsed.data.email },
  })

  revalidateProfile()

  return { ok: true, message: "Email actualizado." }
}

export async function changePasswordAction(
  input: unknown,
): Promise<ProfileActionResult> {
  const session = await requireAppSession()

  if (isDemoSession(session)) {
    return { ok: false, message: "No disponible en la cuenta demo." }
  }

  if (session.auth.provider !== "better-auth") {
    return { ok: false, message: "La contraseña se gestiona con tu proveedor de acceso." }
  }

  const parsed = changePasswordSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, message: "Revisa las contraseñas introducidas." }
  }

  try {
    const auth = await getAuth()
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
    })
  } catch {
    return { ok: false, message: "La contraseña actual no es correcta." }
  }

  return { ok: true, message: "Contraseña actualizada." }
}
