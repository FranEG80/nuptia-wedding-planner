"use client"

import { useMemo, useState } from "react"

import { ResolvedWeddingSiteTemplate } from "@/domains/wedding-sites/adapters/next/components/themes/resolve-wedding-site-template"
import type { WeddingExperienceContent } from "@/domains/wedding-sites/application/dtos/wedding-experience.dto"
import {
  DEFAULT_WEDDING_SITE_PAGE_ID,
  normalizeWeddingSitePageId,
  resolveWeddingSitePages,
  type WeddingSitePageId,
} from "@/domains/wedding-sites/domain/wedding-site-page"
import type { WeddingSiteTheme } from "@/domains/wedding-sites/domain/wedding-site-theme"

/**
 * Contenedor común de la web de boda: mantiene la navegación por subpáginas y
 * delega el diseño en el template elegido.
 */
export function WeddingSite({
  content,
  theme,
  preview = false,
}: {
  content: WeddingExperienceContent
  theme: WeddingSiteTheme
  preview?: boolean
}) {
  const pages = useMemo(
    () => resolveWeddingSitePages(content.enabledModules),
    [content.enabledModules],
  )
  const [page, setPage] = useState<WeddingSitePageId>(DEFAULT_WEDDING_SITE_PAGE_ID)
  // Si un módulo se desactiva, su subpágina desaparece y volvemos a inicio.
  const currentPage = normalizeWeddingSitePageId(page, pages)

  function navigate(nextPage: WeddingSitePageId) {
    // Salto instantáneo: un scroll suave dejaría las animaciones de entrada
    // midiendo posiciones que ya no existen al montar la nueva subpágina.
    window.scrollTo({ top: 0, behavior: "auto" })
    setPage(nextPage)
  }

  return (
    <ResolvedWeddingSiteTemplate
      content={content}
      theme={theme}
      pages={pages}
      currentPage={currentPage}
      onNavigate={navigate}
      preview={preview}
    />
  )
}
