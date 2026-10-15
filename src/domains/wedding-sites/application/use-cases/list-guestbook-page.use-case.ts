import {
  toGuestbookSignatureDto,
  type GuestbookPageDto,
} from "@/domains/wedding-sites/application/dtos/guestbook.dto"
import {
  clampGuestbookPage,
  GUESTBOOK_PAGE_SIZE,
  guestbookPageCount,
} from "@/domains/wedding-sites/domain/guestbook"
import type { GuestbookRepository } from "@/domains/wedding-sites/domain/ports/guestbook.repository"

/**
 * Una página del tablón. Si la página pedida ya no existe (se ocultaron firmas
 * mientras alguien navegaba), devuelve la última que sí existe.
 */
export async function listGuestbookPageUseCase(input: {
  guestbookRepository: GuestbookRepository
  weddingId: string
  page: number
  pageSize?: number
}): Promise<GuestbookPageDto> {
  const pageSize = input.pageSize ?? GUESTBOOK_PAGE_SIZE
  const requested = clampGuestbookPage(input.page, Number.POSITIVE_INFINITY)
  const load = (page: number) =>
    input.guestbookRepository.listPage(input.weddingId, {
      offset: (page - 1) * pageSize,
      limit: pageSize,
    })

  let result = await load(requested)
  const page = clampGuestbookPage(requested, guestbookPageCount(result.total, pageSize))

  if (page !== requested) {
    result = await load(page)
  }

  return {
    signatures: result.signatures.map(toGuestbookSignatureDto),
    page,
    pageCount: guestbookPageCount(result.total, pageSize),
    total: result.total,
  }
}
