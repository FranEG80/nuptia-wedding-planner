import "server-only"

import { PrismaD1 } from "@prisma/adapter-d1"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { connection } from "next/server"
import { cache } from "react"

import { PrismaClient } from "@generated/prisma/client"

export const getPrisma = cache(async () => {
  await connection()
  const { env } = getCloudflareContext()
  const adapter = new PrismaD1(env.DB)

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
})
