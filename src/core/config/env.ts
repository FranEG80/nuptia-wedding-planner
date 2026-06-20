import "server-only"

import { z } from "zod"

const envSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_PROVIDER: z.enum(["better-auth", "supabase"]).default("better-auth"),
  AUTH_ENFORCE: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  DATABASE_URL: z.string().default("file:./prisma/dev.db"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32).default("local-development-secret-change-before-production"),
  BETTER_AUTH_DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).default("sqlite"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(""),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional().default(""),
  SUPABASE_SECRET_KEY: z.string().optional().default(""),
  STORAGE_PROVIDER: z.enum(["local", "supabase"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("./storage/uploads"),
  SUPABASE_STORAGE_BUCKET: z.string().default("wedding-media"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Nuptia <hola@nuptia.local>"),
  SPOTIFY_CLIENT_ID: z.string().optional().default(""),
  SPOTIFY_CLIENT_SECRET: z.string().optional().default(""),
  SPOTIFY_REDIRECT_URI: z.string().url().default("http://localhost:3000/api/integrations/spotify/callback"),
})

export const env = envSchema.parse(process.env)
