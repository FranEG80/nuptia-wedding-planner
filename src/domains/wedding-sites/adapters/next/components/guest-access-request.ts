import type { VerifyGuestPhoneResult } from "@/domains/wedding-sites/adapters/next/guest-access-actions"

export class GuestAccessRequestError extends Error {
  constructor(readonly code: string, readonly requestId: string | null) {
    super(code)
    this.name = "GuestAccessRequestError"
  }
}

export async function verifyGuestPhoneRequest(input: { slug: string; phone: string }): Promise<VerifyGuestPhoneResult> {
  const response = await fetch(`/api/w/${encodeURIComponent(input.slug)}/guest-access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: input.phone }),
    cache: "no-store",
  })
  const requestId = response.headers.get("x-request-id")
  let body: unknown

  try {
    body = await response.json()
  } catch {
    throw new GuestAccessRequestError("INVALID_SERVER_RESPONSE", requestId)
  }

  if (body && typeof body === "object" && "status" in body &&
      ["found", "photographer", "invalid_phone", "not_found", "unavailable"].includes(String(body.status))) {
    return body as VerifyGuestPhoneResult
  }

  const error = (body as { error?: { code?: string; requestId?: string } } | null)?.error
  throw new GuestAccessRequestError(error?.code ?? "GUEST_ACCESS_REQUEST_FAILED", error?.requestId ?? requestId)
}
