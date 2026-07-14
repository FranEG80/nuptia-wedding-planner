import "server-only"

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

import { env } from "@/core/config/env"
import { sqliteDriverUrlFromDatabaseUrl } from "@/core/db/sqlite-url"
import { PrismaClient } from "@generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}
let adapter: PrismaBetterSqlite3 | PrismaMariaDb | undefined = undefined

if (env.DATABASE_URL.startsWith("file:") && !env.DATABASE_URL.includes("://")) {
  adapter = new PrismaBetterSqlite3({
    url: sqliteDriverUrlFromDatabaseUrl(env.DATABASE_URL),
  })
} else {
  const [user, password, host, port, database] =  env.DATABASE_URL.replace(/^(mysql|mariadb):\/\//, "").split(/[:@/]/)

  adapter = new PrismaMariaDb({
    host,
    port: Number(port),
    user,
    password,
    database,
    connectionLimit: 5,
  })
}


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
