import { toNextJsHandler } from "better-auth/next-js"

import { getAuth } from "@/core/auth/better-auth"
import {
  apiErrorResponse,
  reportUnexpectedApiError,
  secureApiErrorResponse,
  withApiErrorHandling,
} from "@/shared/http/api-errors"

type AuthMethod = "GET" | "POST"

async function handleAuthRequest(request: Request, method: AuthMethod) {
  const handlers = toNextJsHandler(await getAuth())
  const response =
    method === "GET"
      ? await handlers.GET(request)
      : await handlers.POST(request)

  if (response.status < 400) {
    return response
  }

  if (response.status < 500) {
    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      return secureApiErrorResponse(response)
    }

    return apiErrorResponse({
      code:
        response.status === 404
          ? "AUTH_ROUTE_NOT_FOUND"
          : "AUTH_REQUEST_REJECTED",
      message:
        response.status === 404
          ? "Endpoint de autenticación no encontrado."
          : "Solicitud de autenticación no válida.",
      status: response.status,
    })
  }

  const requestId = reportUnexpectedApiError(
    `auth.${method.toLowerCase()}`,
    new Error(`Better Auth returned HTTP ${response.status}`),
  )

  return apiErrorResponse({
    code: "AUTH_SERVICE_ERROR",
    message: "No se pudo completar la autenticación.",
    requestId,
    status: 500,
  })
}

export function GET(request: Request) {
  return withApiErrorHandling(
    {
      code: "AUTH_SERVICE_ERROR",
      message: "No se pudo completar la autenticación.",
      operation: "auth.get",
    },
    () => handleAuthRequest(request, "GET"),
  )
}

export function POST(request: Request) {
  return withApiErrorHandling(
    {
      code: "AUTH_SERVICE_ERROR",
      message: "No se pudo completar la autenticación.",
      operation: "auth.post",
    },
    () => handleAuthRequest(request, "POST"),
  )
}
