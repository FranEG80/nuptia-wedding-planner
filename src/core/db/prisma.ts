import "server-only"

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

import { env } from "@/core/config/env"
import { sqliteDriverUrlFromDatabaseUrl } from "@/core/db/sqlite-url"
import { PrismaClient } from "@generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const adapter = new PrismaBetterSqlite3({
  url: sqliteDriverUrlFromDatabaseUrl(env.DATABASE_URL),
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
