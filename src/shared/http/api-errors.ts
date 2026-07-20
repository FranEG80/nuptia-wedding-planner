export type ApiErrorBody = {
  error: {
    code: string
    message: string
    requestId: string
  }
}

type ApiErrorResponseInput = {
  code: string
  message: string
  status: number
  requestId?: string
}

type UnexpectedApiErrorInput = {
  code?: string
  message?: string
  operation: string
}

const defaultInternalError = {
  code: "INTERNAL_SERVER_ERROR",
  message: "No se pudo completar la solicitud.",
} as const

export function reportUnexpectedApiError(operation: string, error: unknown) {
  const requestId = crypto.randomUUID()

  console.error("Unexpected API error", {
    error,
    operation,
    requestId,
  })

  return requestId
}

export function apiErrorResponse({
  code,
  message,
  status,
  requestId = crypto.randomUUID(),
}: ApiErrorResponseInput) {
  return Response.json(
    {
      error: {
        code,
        message,
        requestId,
      },
    } satisfies ApiErrorBody,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": requestId,
      },
    },
  )
}

export function secureApiErrorResponse(
  response: Response,
  requestId = crypto.randomUUID(),
) {
  const headers = new Headers(response.headers)

  headers.set("Cache-Control", "no-store")
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("X-Request-Id", requestId)

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

export function unexpectedApiErrorResponse(
  error: unknown,
  {
    code = defaultInternalError.code,
    message = defaultInternalError.message,
    operation,
  }: UnexpectedApiErrorInput,
) {
  const requestId = reportUnexpectedApiError(operation, error)

  return apiErrorResponse({
    code,
    message,
    requestId,
    status: 500,
  })
}

export async function withApiErrorHandling(
  input: UnexpectedApiErrorInput,
  handler: () => Promise<Response> | Response,
) {
  try {
    return await handler()
  } catch (error) {
    return unexpectedApiErrorResponse(error, input)
  }
}
