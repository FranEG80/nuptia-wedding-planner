import "server-only"

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins"
import { cache } from "react"

import { env } from "@/core/config/env"
import { getPrisma } from "@/core/db/prisma"

export const getAuth = cache(async () =>
  betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(await getPrisma(), {
      provider: env.BETTER_AUTH_DATABASE_PROVIDER,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 7,
    },
    plugins: [admin(), nextCookies()],
  }),
)
