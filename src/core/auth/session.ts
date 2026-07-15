import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { env } from "@/core/config/env"
import type { AppSession, AuthSession } from "@/core/auth/types"
import { resolveAppUserForAuthSession } from "@/core/auth/app-user"
import { getAuth } from "@/core/auth/better-auth"
import { createSupabaseServerClient } from "@/core/auth/supabase/server"

const demoSession: AuthSession = {
  provider: "demo",
  user: {
    id: "demo-user",
    email: "demo@nuptia.local",
    name: "Maria e Ignacio",
    imageUrl: null,
  },
}

async function getBetterAuthSession(): Promise<AuthSession | null> {
  try {
    const auth = await getAuth()
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return null
    }

    return {
      provider: "better-auth",
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        imageUrl: session.user.image,
      },
    }
  } catch {
    return null
  }
}

async function getSupabaseSession(): Promise<AuthSession | null> {
  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return {
    provider: "supabase",
    user: {
      id: data.user.id,
      email: data.user.email ?? "",
      name:
        data.user.user_metadata?.name ??
        data.user.user_metadata?.full_name ??
        data.user.email ??
        "Usuario",
      imageUrl: data.user.user_metadata?.avatar_url ?? null,
    },
  }
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const session =
    env.AUTH_PROVIDER === "supabase"
      ? await getSupabaseSession()
      : await getBetterAuthSession()

  if (session) {
    return session
  }

  return env.AUTH_ENFORCE ? null : demoSession
}

export async function requireSession() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

export async function getCurrentAppSession(): Promise<AppSession | null> {
  const session = await getCurrentSession()

  if (!session) {
    return null
  }

  const appUser = await resolveAppUserForAuthSession(session)

  return {
    auth: session,
    appUser,
  }
}

export async function requireAppSession() {
  const session = await getCurrentAppSession()

  if (!session) {
    redirect("/login")
  }

  return session
}
