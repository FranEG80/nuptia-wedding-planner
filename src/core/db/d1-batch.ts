export interface D1BatchStatement {
  readonly sql: string
  readonly params: readonly unknown[]
}

export interface D1BatchDatabase {
  prepare(sql: string): D1BatchPreparedStatement
  batch(statements: readonly D1BatchStatement[]): Promise<void>
}

export interface D1BatchPreparedStatement extends D1BatchStatement {
  bind(...values: unknown[]): D1BatchPreparedStatement
}

export interface D1HttpCredentials {
  token: string
  accountId: string
  databaseId: string
}

interface D1ApiError {
  message?: string
}

interface D1ApiResult {
  success?: boolean
}

interface D1ApiResponse {
  success?: boolean
  errors?: D1ApiError[]
  result?: D1ApiResult[]
}

class BatchStatement implements D1BatchPreparedStatement {
  constructor(
    readonly sql: string,
    readonly params: readonly unknown[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new BatchStatement(this.sql, values)
  }
}

function formatD1ApiError(payload: D1ApiResponse | null, status: number) {
  const message = payload?.errors?.find((error) => error.message)?.message

  return message
    ? `Cloudflare D1 respondió con un error: ${message}`
    : `Cloudflare D1 respondió con HTTP ${status}`
}

function assertHttpSerializable(
  value: unknown,
): asserts value is string | number | null {
  if (
    value === null ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return
  }

  throw new TypeError(
    `D1 HTTP no puede serializar un parámetro de tipo ${typeof value}`,
  )
}

export function createBindingD1BatchDatabase(
  database: D1Database,
): D1BatchDatabase {
  return {
    prepare(sql) {
      return new BatchStatement(sql)
    },
    async batch(statements) {
      const preparedStatements = statements.map((statement) =>
        database.prepare(statement.sql).bind(...statement.params),
      )

      await database.batch(preparedStatements)
    },
  }
}

export function createHttpD1BatchDatabase(
  credentials: D1HttpCredentials,
  request: typeof fetch = fetch,
): D1BatchDatabase {
  const endpoint =
    `https://api.cloudflare.com/client/v4/accounts/${credentials.accountId}` +
    `/d1/database/${credentials.databaseId}/query`

  return {
    prepare(sql) {
      return new BatchStatement(sql)
    },
    async batch(statements) {
      const batch = statements.map((statement) => {
        const params = statement.params.map((value) => {
          assertHttpSerializable(value)
          return value
        })

        return { sql: statement.sql, params }
      })
      const response = await request(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batch }),
      })
      const payload = (await response.json().catch(() => null)) as
        | D1ApiResponse
        | null

      if (!response.ok || payload?.success !== true) {
        throw new Error(formatD1ApiError(payload, response.status))
      }

      if (
        !Array.isArray(payload.result) ||
        payload.result.length !== statements.length ||
        payload.result.some((result) => result.success !== true)
      ) {
        throw new Error("Cloudflare D1 devolvió un resultado de batch incompleto")
      }
    },
  }
}
