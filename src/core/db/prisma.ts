import "server-only"

import { PrismaD1 } from "@prisma/adapter-d1"
import { connection } from "next/server"
import { cache } from "react"

import { PrismaClient } from "@generated/prisma/client"
import { env, getD1HttpCredentials } from "@/core/config/env"
import {
  createBindingD1BatchDatabase,
  createHttpD1BatchDatabase,
} from "@/core/db/d1-batch"

const isVercelRuntime = () => process.env.VERCEL === "1"

const getCloudflareD1 = cache(async () => {
  await connection()
  const { getCloudflareContext } = await import("@opennextjs/cloudflare")
  const { env } = getCloudflareContext()

  return env.DB
})

export const getD1 = cache(async () => {
  await connection()

  if (isVercelRuntime()) {
    return createHttpD1BatchDatabase(getD1HttpCredentials())
  }

  return createBindingD1BatchDatabase(await getCloudflareD1())
})

export const getPrisma = cache(async () => {
  await connection()
  const credentials = isVercelRuntime() ? getD1HttpCredentials() : null
  const adapter = credentials
    ? new PrismaD1({
        CLOUDFLARE_D1_TOKEN: credentials.token,
        CLOUDFLARE_ACCOUNT_ID: credentials.accountId,
        CLOUDFLARE_DATABASE_ID: credentials.databaseId,
      })
    : new PrismaD1(await getCloudflareD1())

  return new PrismaClient({
    adapter,
    log:
      env.DATABASE_QUERY_LOG_ENABLED
        ? ["query", "error", "warn"]
        : process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
  })
})
