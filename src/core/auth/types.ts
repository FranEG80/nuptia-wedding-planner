export type AuthProvider = "better-auth" | "supabase"

export interface AuthSession {
  provider: AuthProvider
  user: {
    id: string
    email: string
    name: string
    imageUrl?: string | null
  }
}

export interface AppUser {
  id: string
  email: string
  name: string
  lastName: string | null
  phone: string | null
  imageUrl: string | null
}

export interface AppSession {
  auth: AuthSession
  appUser: AppUser
}
