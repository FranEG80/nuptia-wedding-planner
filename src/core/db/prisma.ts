import "server-only"

import { PrismaD1 } from "@prisma/adapter-d1"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { connection } from "next/server"
import { cache } from "react"

import { PrismaClient } from "@generated/prisma/client"

export const getD1 = cache(async () => {
  await connection()
  const { env } = getCloudflareContext()

  return env.DB
})

export const getPrisma = cache(async () => {
  const adapter = new PrismaD1(await getD1())

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
})
