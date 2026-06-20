import path from "node:path"

export function sqliteDriverUrlFromDatabaseUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    return databaseUrl
  }

  const filePath = databaseUrl.replace(/^file:/, "")

  if (filePath === ":memory:" || path.isAbsolute(filePath)) {
    return filePath
  }

  return path.resolve(process.cwd(), filePath)
}
