import "server-only"

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"

import { env } from "@/core/config/env"
import { prisma } from "@/core/db/prisma"

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: env.BETTER_AUTH_DATABASE_PROVIDER,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
})
