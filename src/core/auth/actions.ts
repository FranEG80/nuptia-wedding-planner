"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"

import { loginFormSchema } from "@/core/auth/auth-form-schemas"
import { getAuth } from "@/core/auth/better-auth"
import { PUBLIC_DEMO_ACCOUNT } from "@/core/auth/demo-account"

export interface LoginActionState {
  message: string
}

async function signIn(email: string, password: string) {
  const auth = await getAuth()

  await auth.api.signInEmail({
    body: { email, password, rememberMe: true },
  })
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { message: "Revisa el email y la contraseña." }
  }

  try {
    await signIn(parsed.data.email, parsed.data.password)
  } catch {
    return { message: "El email o la contraseña no son correctos." }
  }

  redirect("/app/dashboard")
}

export async function signInDemoAction() {
  try {
    await signIn(PUBLIC_DEMO_ACCOUNT.email, PUBLIC_DEMO_ACCOUNT.password)
  } catch {
    redirect("/login?demoError=1")
  }

  redirect("/app/dashboard")
}

export async function signOutAction() {
  const auth = await getAuth()
  await auth.api.signOut({ headers: await headers() })
  redirect("/login")
}
