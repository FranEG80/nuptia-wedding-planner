import type { WeddingSiteModuleType } from "@/domains/wedding-sites/domain/wedding-site-module"

/**
 * La web de boda se navega por subpáginas, igual en todos los templates.
 * "Inicio" siempre está disponible; el resto aparece si su módulo está activo.
 */
export const WEDDING_SITE_PAGES = [
  { id: "inicio", label: "Inicio", module: null },
  { id: "menu", label: "Menú", module: "menu" },
  { id: "itinerario", label: "Itinerario", module: "timeline" },
  { id: "regalos", label: "Regalos", module: "gifts" },
  { id: "musica", label: "Música", module: "spotify" },
  { id: "galeria", label: "Galería", module: "gallery" },
] as const satisfies ReadonlyArray<{
  id: string
  label: string
  module: WeddingSiteModuleType | null
}>

export type WeddingSitePageId = (typeof WEDDING_SITE_PAGES)[number]["id"]

export interface WeddingSitePage {
  id: WeddingSitePageId
  label: string
}

export const DEFAULT_WEDDING_SITE_PAGE_ID: WeddingSitePageId = "inicio"

export function resolveWeddingSitePages(
  enabledModules: readonly WeddingSiteModuleType[],
): WeddingSitePage[] {
  return WEDDING_SITE_PAGES.filter(
    (page) => page.module === null || enabledModules.includes(page.module),
  ).map((page) => ({ id: page.id, label: page.label }))
}

export function normalizeWeddingSitePageId(
  value: string | undefined,
  pages: readonly WeddingSitePage[],
): WeddingSitePageId {
  return pages.some((page) => page.id === value)
    ? (value as WeddingSitePageId)
    : DEFAULT_WEDDING_SITE_PAGE_ID
}
