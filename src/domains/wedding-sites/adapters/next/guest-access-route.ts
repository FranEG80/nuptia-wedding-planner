import { z } from "zod"

import type { VerifyGuestPhoneResult } from "@/domains/wedding-sites/adapters/next/guest-access-actions"
import { apiErrorResponse, reportUnexpectedApiError } from "@/shared/http/api-errors"

const inputSchema = z.object({
  slug: z.string().min(1).max(200),
  phone: z.string().max(40),
})

/** El import de la implementación se hace dentro del try, para capturar también
 * errores al cargar módulos del servidor y devolver siempre JSON. */
export function createGuestAccessPostHandler(
  verify: (input: { slug: string; phone: string }) => Promise<VerifyGuestPhoneResult>,
) {
  return async (request: Request, context: { params: Promise<{ slug: string }> }) => {
    const requestId = crypto.randomUUID()
    let operation = "guest-access.parse-request"

    try {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return apiErrorResponse({ code: "INVALID_JSON", message: "El cuerpo debe ser JSON válido.", status: 400, requestId })
      }

      const { slug } = await context.params
      const parsed = inputSchema.safeParse({ slug, phone: (body as { phone?: unknown } | null)?.phone })

      if (!parsed.success) {
        return apiErrorResponse({ code: "INVALID_GUEST_ACCESS_REQUEST", message: "Indica un teléfono válido.", status: 400, requestId })
      }

      operation = "guest-access.verify-phone"
      const result = await verify(parsed.data)
      const status = result.status === "invalid_phone" ? 400
        : result.status === "not_found" ? 404
        : result.status === "unavailable" ? 503 : 200

      return Response.json({ ...result, requestId }, {
        status,
        headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
      })
    } catch (error) {
      reportUnexpectedApiError(operation, error, requestId)
      return apiErrorResponse({
        code: "GUEST_ACCESS_VERIFICATION_FAILED",
        message: "No se pudo comprobar el teléfono. Usa esta referencia para localizar el error en los logs del servidor.",
        status: 500,
        requestId,
      })
    }
  }
}
