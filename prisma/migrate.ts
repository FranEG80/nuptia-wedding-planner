import Database from "better-sqlite3"
import { createHash, randomUUID } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { sqliteDriverUrlFromDatabaseUrl } from "../src/core/db/sqlite-url"

const migrationsDir = path.join(process.cwd(), "prisma", "migrations")
const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db"
const sqliteUrl = sqliteDriverUrlFromDatabaseUrl(databaseUrl)

function checksum(sql: string) {
  return createHash("sha256").update(sql).digest("hex")
}

function ensureDatabaseDir() {
  if (sqliteUrl === ":memory:") {
    return
  }

  fs.mkdirSync(path.dirname(sqliteUrl), { recursive: true })
}

function migrationNames() {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

ensureDatabaseDir()

const db = new Database(sqliteUrl)

db.pragma("foreign_keys = ON")
db.exec(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  );
`)

const findMigration = db.prepare<
  [string],
  { checksum: string; finished_at: string | null; rolled_back_at: string | null }
>(
  `SELECT "checksum", "finished_at", "rolled_back_at"
   FROM "_prisma_migrations"
   WHERE "migration_name" = ?`,
)

const insertMigration = db.prepare<{
  id: string
  checksum: string
  finishedAt: string
  migrationName: string
}>(
  `INSERT INTO "_prisma_migrations"
    ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
   VALUES
    (@id, @checksum, @finishedAt, @migrationName, @finishedAt, 1)`,
)

let appliedCount = 0

for (const migrationName of migrationNames()) {
  const migrationPath = path.join(migrationsDir, migrationName, "migration.sql")
  const sql = fs.readFileSync(migrationPath, "utf8").trim()
  const migrationChecksum = checksum(sql)
  const existing = findMigration.get(migrationName)

  if (existing?.finished_at) {
    if (existing.checksum !== migrationChecksum) {
      throw new Error(
        `Migration ${migrationName} was already applied with a different checksum.`,
      )
    }

    continue
  }

  if (existing && !existing.rolled_back_at) {
    throw new Error(
      `Migration ${migrationName} exists in _prisma_migrations but was not completed.`,
    )
  }

  const disablesForeignKeys = sql.includes("PRAGMA foreign_keys=OFF")

  if (disablesForeignKeys) {
    db.pragma("foreign_keys = OFF")
  }

  try {
    db.transaction(() => {
      db.exec(sql)
      insertMigration.run({
        id: randomUUID(),
        checksum: migrationChecksum,
        finishedAt: new Date().toISOString(),
        migrationName,
      })
    })()
  } finally {
    if (disablesForeignKeys) {
      db.pragma("foreign_keys = ON")
    }
  }

  appliedCount += 1
  console.log(`Applied migration ${migrationName}`)
}

db.close()

if (appliedCount === 0) {
  console.log("No pending SQLite migrations.")
} else {
  console.log(`Applied ${appliedCount} SQLite migration(s).`)
}
