"use client"

import { useEffect, useRef, useState, useTransition } from "react"

import { listGuestbookPageAction } from "@/domains/wedding-sites/adapters/next/guestbook-actions"
import type {
  GuestbookPageDto,
  GuestbookSignatureDto,
} from "@/domains/wedding-sites/application/dtos/guestbook.dto"
import { SAMPLE_GUESTBOOK_SIGNATURES } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"

const SAMPLE_GUESTBOOK: GuestbookPageDto = {
  signatures: SAMPLE_GUESTBOOK_SIGNATURES,
  page: 1,
  pageCount: 1,
  total: SAMPLE_GUESTBOOK_SIGNATURES.length,
}

/**
 * Estado del tablón de firmas: la página visible, el cambio de página contra
 * el servidor y la firma recién colgada. En el editor enseña firmas de ejemplo
 * mientras no haya reales y no pide nada al servidor.
 */
export function useGuestbook({
  slug,
  initial,
  preview,
}: {
  slug: string
  initial: GuestbookPageDto
  preview: boolean
}) {
  const [guestbook, setGuestbook] = useState(() =>
    preview && initial.total === 0 ? SAMPLE_GUESTBOOK : initial,
  )
  const [highlightId, setHighlightId] = useState<string | null>(null)
  // Tras navegar, las firmas entran con su propia animación: las de la primera
  // carga ya las revela el scroll de la plantilla.
  const [hasNavigated, setHasNavigated] = useState(false)
  const [hasPageError, setHasPageError] = useState(false)
  const [isPaging, startPaging] = useTransition()
  const boardRef = useRef<HTMLDivElement>(null)
  const scrollOnRenderRef = useRef(false)

  useEffect(() => {
    if (!scrollOnRenderRef.current) {
      return
    }

    scrollOnRenderRef.current = false
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    boardRef.current?.scrollIntoView({
      block: "start",
      behavior: reduceMotion ? "auto" : "smooth",
    })
  }, [guestbook.page])

  function goToPage(page: number) {
    if (preview || isPaging || page === guestbook.page) {
      return
    }

    setHasPageError(false)

    startPaging(async () => {
      try {
        const result = await listGuestbookPageAction({ slug, page })

        if (result.status !== "ok") {
          setHasPageError(true)
          return
        }

        scrollOnRenderRef.current = true
        setHasNavigated(true)
        setHighlightId(null)
        setGuestbook(result.guestbook)
      } catch {
        setHasPageError(true)
      }
    })
  }

  /**
   * Enseña la primera página con la firma nueva destacada. Solo la nueva se
   * anima: las que ya estaban no vuelven a entrar.
   */
  function showSignature(signature: GuestbookSignatureDto, firstPage: GuestbookPageDto) {
    setHasPageError(false)
    setHighlightId(signature.id)
    setGuestbook(firstPage)
  }

  return {
    guestbook,
    boardRef,
    goToPage,
    showSignature,
    highlightId,
    hasNavigated,
    hasPageError,
    isPaging,
  }
}

export type GuestbookState = ReturnType<typeof useGuestbook>
